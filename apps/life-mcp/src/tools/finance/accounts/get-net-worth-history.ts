import { z } from 'zod';
import { getNetWorthHistory } from '../../../api/finance-accounts-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  months: z.number().int().min(1).max(60).optional().describe('How many months of history to return (default 12).'),
};

export const getNetWorthHistoryTool = defineTool({
  name: 'finance_get_net_worth_history',
  backend: 'finance',
  config: {
    title: 'Get net worth trend over time',
    description:
      'Get the net-worth trend over time, reconstructed from account transaction history. Accounts only — ' +
      "manually-tracked assets aren't included since their values aren't snapshotted historically (use " +
      'finance_get_net_worth for the current total including assets).',
    inputSchema,
  },
  async handler(args, { http }) {
    const history = await getNetWorthHistory(http, args.months);
    const lines = [
      `# Net worth history`,
      ...history.map((p) => `- ${p.monthLabel} ${p.year}: £${p.netWorth}`),
    ];
    return textResult(lines.join('\n'), { history });
  },
});
