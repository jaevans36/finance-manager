import { listFinanceAccounts } from '../../../api/finance-accounts-api.js';
import { formatAccountList } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getFinanceAccountsTool = defineTool({
  name: 'finance_get_accounts',
  backend: 'finance',
  config: {
    title: 'List finance accounts',
    description:
      "List the current user's finance accounts (checking, savings, credit, ISAs, mortgages, etc.), " +
      'including any accounts shared with them. Use the returned account id with finance_get_transactions ' +
      'or finance_add_manual_transaction.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const accounts = await listFinanceAccounts(http);
    return textResult(formatAccountList(accounts, `# Accounts (${accounts.length})`), { accounts });
  },
});
