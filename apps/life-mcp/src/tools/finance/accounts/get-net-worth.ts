import { getNetWorth } from '../../../api/finance-accounts-api.js';
import { defineTool, textResult } from '../../_register.js';

export const getNetWorthTool = defineTool({
  name: 'finance_get_net_worth',
  backend: 'finance',
  config: {
    title: 'Get current net worth',
    description:
      "Get the current total net worth — all finance account balances plus manually-tracked assets " +
      "(finance_get_assets), minus debts. Use finance_get_net_worth_history for the trend over time " +
      '(accounts only, no assets, since asset values aren\'t snapshotted historically).',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const result = await getNetWorth(http);
    return textResult(`Net worth: £${result.netWorth}`, { netWorth: result.netWorth });
  },
});
