import { z } from 'zod';
import { listBills } from '../../../api/finance-bills-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().optional().describe('Filter to bills linked to one account (from finance_get_accounts).'),
};

export const getBillsTool = defineTool({
  name: 'finance_get_bills',
  backend: 'finance',
  config: {
    title: 'List bills',
    description:
      'List all active bills (recurring fixed costs like utilities, insurance, subscriptions) with amount, ' +
      'frequency, due day, and whether the linked account payment matches what was set up. Use ' +
      'finance_get_bills_due for a look-ahead of what\'s coming up soon instead.',
    inputSchema,
  },
  async handler(args, { http }) {
    const bills = await listBills(http, args.accountId);
    const lines = [
      `# Bills (${bills.length})`,
      ...bills.map(
        (b) =>
          `- **${b.name}**: £${b.amount} ${b.frequency}, due day ${b.dueDay}` +
          (b.categoryName ? ` — ${b.categoryName}` : '') +
          (b.hasPaymentMismatch ? ' ⚠️ linked account payment doesn\'t match' : '') +
          `  \`${b.id}\``,
      ),
    ];
    return textResult(lines.join('\n'), { bills });
  },
});
