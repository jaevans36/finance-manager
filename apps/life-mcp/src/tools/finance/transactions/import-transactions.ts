import { z } from 'zod';
import { importTransactionsCsv } from '../../../api/finance-transactions-api.js';
import { KNOWN_BANK_FORMATS } from '../../../types/finance-transaction.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account to import into (from finance_get_accounts).'),
  csv: z
    .string()
    .min(1)
    .describe(
      'CSV content, one transaction per line. For a real bank export, pass its content and the matching ' +
        'bankFormat. For a PDF statement (or anything else without a native parser), build a CSV yourself in ' +
        'the "generic" shape: a header row "Date,Description,Amount" followed by one row per transaction — ' +
        'Date as DD/MM/YYYY or YYYY-MM-DD, Amount positive for money in and negative for money out — and pass ' +
        'bankFormat "generic".',
    ),
  bankFormat: z
    .enum(KNOWN_BANK_FORMATS)
    .default('generic')
    .describe('Bank format to parse with. Use "generic" for anything not from one of the named banks.'),
};

export const importTransactionsTool = defineTool({
  name: 'finance_import_transactions',
  backend: 'finance',
  config: {
    title: 'Import transactions from a CSV or statement',
    description:
      'Import a batch of transactions into an account from CSV content — either a real bank CSV export, or a ' +
      'CSV you build yourself from a PDF statement you\'ve read. Duplicate detection happens against the real ' +
      "database (account + date + amount + description), not conversation memory, so it's safe to re-run this " +
      'if unsure whether a statement was already imported — duplicates are flagged, not silently re-added.',
    inputSchema,
  },
  async handler(args, { http }) {
    const result = await importTransactionsCsv(http, args.accountId, args.csv, args.bankFormat);
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
      lines.push('', `## Rows skipped (${result.skipped})`, ...result.skipMessages.map((m) => `- ${m}`));
    }
    return textResult(lines.join('\n'), { result });
  },
});
