import { z } from 'zod';
import { createFinanceAccount } from '../../../api/finance-accounts-api.js';
import { ACCOUNT_TYPES } from '../../../types/finance-account.js';
import { formatAccountList } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1).describe('Account name, e.g. "HSBC Current Account".'),
  type: z.enum(ACCOUNT_TYPES).describe('Account type.'),
  currency: z.string().length(3).describe('ISO currency code, e.g. "GBP".'),
  initialBalance: z.number().optional().describe('Starting balance.'),
  institution: z.string().optional().describe('Bank/lender name.'),
  excludeFromNetWorth: z.boolean().optional(),
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

export const createAccountTool = defineTool({
  name: 'finance_create_account',
  backend: 'finance',
  config: {
    title: 'Create a finance account',
    description:
      'Create a new finance account (checking, savings, credit card, ISA, mortgage, loan, etc). ' +
      'For a debt account (Credit/Mortgage/Loan), pass the debt-specific fields you have (interestRate, ' +
      'creditLimit, minimumMonthlyPayment) up front where possible, then use finance_check_account_completeness ' +
      'on the returned account to see what else is worth asking about for accurate debt projections.',
    inputSchema,
  },
  async handler(args, { http }) {
    const account = await createFinanceAccount(http, args);
    return textResult(formatAccountList([account], '# Created'), { account });
  },
});
