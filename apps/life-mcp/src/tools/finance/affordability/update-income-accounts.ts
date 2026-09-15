import { z } from 'zod';
import { updateIncomeAccounts } from '../../../api/finance-affordability-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountIds: z
    .array(z.string().uuid())
    .describe(
      'Accounts to scope income detection to for finance_get_disposable_income (from finance_get_accounts). ' +
        'Set this explicitly on a shared/joint account so a partner\'s salary or a transfer-in isn\'t ' +
        "misclassified as this user's own income. Replaces the current list entirely.",
    ),
};

export const updateIncomeAccountsTool = defineTool({
  name: 'finance_update_income_accounts',
  backend: 'finance',
  config: {
    title: 'Set which accounts count as income sources',
    description:
      'Configure which accounts finance_get_disposable_income scans for income — a required setup step for ' +
      'an accurate disposable-income figure, especially on a shared/joint account where a transfer-in or a ' +
      "partner's salary would otherwise be miscounted as this user's income.",
    inputSchema,
  },
  async handler(args, { http }) {
    await updateIncomeAccounts(http, args.accountIds);
    return textResult(`Income detection scoped to ${args.accountIds.length} account(s).`);
  },
});
