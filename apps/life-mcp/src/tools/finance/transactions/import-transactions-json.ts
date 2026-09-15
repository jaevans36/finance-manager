import { z } from 'zod';
import { importTransactionsJson } from '../../../api/finance-transactions-api.js';
import { TRANSACTION_TYPES } from '../../../types/finance-transaction.js';
import { defineTool, textResult } from '../../_register.js';

const entrySchema = z.object({
  transactionDate: z.string().describe('ISO date (YYYY-MM-DD).'),
  description: z.string().min(1),
  amount: z.number().positive().describe('Always positive — direction comes from type.'),
  type: z.enum(TRANSACTION_TYPES),
  reference: z.string().optional(),
  categoryId: z.string().uuid().optional().describe('From finance_get_accounts context or a prior list — if known.'),
  payee: z.string().optional().describe('Clean merchant name, if you already know it — overrides auto-detection.'),
  notes: z.string().optional(),
});

const inputSchema = {
  accountId: z.string().uuid().describe('Account to import into (from finance_get_accounts).'),
  entries: z.array(entrySchema).min(1).max(500).describe('One object per transaction.'),
};

export const importTransactionsJsonTool = defineTool({
  name: 'finance_import_transactions_json',
  backend: 'finance',
  config: {
    title: 'Import transactions as structured entries',
    description:
      'Import a batch of transactions as structured JSON entries — the richer alternative to ' +
      'finance_import_transactions when you already know more than just date/description/amount (a category, ' +
      'a clean payee name, notes) and don\'t want that detail lost by flattening it into CSV text and having ' +
      'it re-guessed. Uses the same server-side dedup as the CSV path (account + date + amount + description), ' +
      "so it's safe to re-run if unsure whether something was already imported.",
    inputSchema,
  },
  async handler(args, { http }) {
    const result = await importTransactionsJson(http, args.accountId, args.entries);
    const lines = [
      `# Import result`,
      '',
      `- **Imported:** ${result.imported}`,
      `- **Duplicates skipped:** ${result.duplicates}`,
      `- **Errors:** ${result.errors}`,
    ];
    if (result.errorMessages.length > 0) {
      lines.push('', '## Errors', ...result.errorMessages.map((m) => `- ${m}`));
    }
    if (result.skipped > 0 && result.skipMessages) {
      lines.push('', `## Entries skipped (${result.skipped})`, ...result.skipMessages.map((m) => `- ${m}`));
    }
    return textResult(lines.join('\n'), { result });
  },
});
