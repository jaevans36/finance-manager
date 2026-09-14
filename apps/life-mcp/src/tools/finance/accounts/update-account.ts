import { z } from 'zod';
import { updateFinanceAccount } from '../../../api/finance-accounts-api.js';
import { ACCOUNT_TYPES } from '../../../types/finance-account.js';
import { formatAccountList } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account to update (from finance_get_accounts).'),
  name: z.string().optional().describe('New account name.'),
  type: z.enum(ACCOUNT_TYPES).optional().describe('New account type.'),
  currency: z.string().length(3).optional().describe('New ISO currency code.'),
  balance: z.number().optional().describe('New balance — e.g. a spoken credit card or mortgage balance update, not a transaction.'),
  institution: z.string().optional().describe('Bank/lender name.'),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
  creditLimit: z.number().optional().describe('Credit card limit.'),
  interestRate: z.number().optional().describe('Annual interest rate, as a percentage (e.g. 21.9 for 21.9%).'),
  promotionalBalance: z.number().optional().describe('Balance still on a promotional rate, if only part of the debt is.'),
  promotionalRate: z.number().optional().describe('Promotional interest rate, as a percentage.'),
  promotionalExpiry: z.string().optional().describe('ISO date the promotional rate ends.'),
  promotionalRevertRate: z.number().optional().describe('Interest rate it reverts to after the promotional period.'),
  mortgageStartDate: z.string().optional().describe('ISO date the mortgage started.'),
  mortgageTermYears: z.number().int().optional().describe('Total mortgage term in years.'),
  isInterestOnly: z.boolean().optional().describe('Whether the mortgage/loan is interest-only.'),
  minimumMonthlyPayment: z.number().optional().describe("Lender's minimum monthly payment."),
  currentMonthlyPayment: z.number().optional().describe('What is actually being paid monthly, if different from the minimum.'),
  loanEndDate: z.string().optional().describe('ISO date a loan is due to be paid off.'),
};

export const updateAccountTool = defineTool({
  name: 'finance_update_account',
  backend: 'finance',
  config: {
    title: 'Update a finance account',
    description:
      "Update an account's details — including a spoken/typed balance update (e.g. \"my mortgage balance is " +
      'now £180,000\") and debt-specific fields (interest rate, credit limit, promotional terms, mortgage ' +
      'term) needed for accurate debt projections. Only the fields you pass are changed; everything else stays ' +
      'as-is. Use finance_check_account_completeness afterwards on a debt account to see what else is worth asking about.',
    inputSchema,
  },
  async handler(args, { http }) {
    const { accountId, ...updates } = args;
    const account = await updateFinanceAccount(http, accountId, updates);
    return textResult(formatAccountList([account], '# Updated'), { account });
  },
});
