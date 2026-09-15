import { z } from 'zod';
import { getFinanceAccount } from '../../../api/finance-accounts-api.js';
import type { AccountSummary, AccountType } from '../../../types/finance-account.js';
import { defineTool, textResult } from '../../_register.js';

interface RequiredField {
  key: keyof AccountSummary;
  label: string;
  why: string;
}

/**
 * What the Debt/Affordability/Negotiation features actually depend on, per debt account
 * type — a debt projection run against an account missing these isn't a real projection.
 * Non-debt account types have nothing required here.
 */
const REQUIRED_FIELDS_BY_TYPE: Partial<Record<AccountType, RequiredField[]>> = {
  Credit: [
    { key: 'interestRate', label: 'interest rate', why: 'needed to project interest cost and payoff time' },
    { key: 'creditLimit', label: 'credit limit', why: 'needed for utilisation and severity scoring' },
    { key: 'minimumMonthlyPayment', label: 'minimum monthly payment', why: "needed to know the lender's floor payment" },
  ],
  Mortgage: [
    { key: 'interestRate', label: 'interest rate', why: 'needed to project interest cost' },
    { key: 'mortgageTermYears', label: 'mortgage term (years)', why: 'needed to project payoff date' },
    { key: 'currentMonthlyPayment', label: 'current monthly payment', why: 'needed for affordability calculations' },
  ],
  Loan: [
    { key: 'interestRate', label: 'interest rate', why: 'needed to project interest cost' },
    { key: 'minimumMonthlyPayment', label: 'minimum monthly payment', why: "needed to know the lender's floor payment" },
    { key: 'loanEndDate', label: 'loan end date', why: 'needed to project payoff date' },
  ],
};

/**
 * Checking only needs these when actually overdrawn — an overdrawn current account counts
 * as debt (see finance_get_debt_overview), but a healthy one genuinely has nothing required.
 */
const OVERDRAFT_FIELDS: RequiredField[] = [
  { key: 'interestRate', label: 'interest rate', why: 'needed to project overdraft interest cost' },
  { key: 'creditLimit', label: 'overdraft limit', why: 'needed for utilisation and severity scoring' },
];

const inputSchema = {
  accountId: z.string().uuid().describe('Account to check (from finance_get_accounts).'),
};

export const checkAccountCompletenessTool = defineTool({
  name: 'finance_check_account_completeness',
  backend: 'finance',
  config: {
    title: 'Check a debt account for missing fields',
    description:
      "Check whether a debt account (credit card, mortgage, loan, or an overdrawn checking account) has the " +
      'fields the Debt/Affordability features actually depend on. Use after creating or updating a debt ' +
      'account, or whenever entering one conversationally, so gaps get flagged and asked about rather than ' +
      "silently left null — a debt projection run against an account with no interest rate isn't a real projection.",
    inputSchema,
  },
  async handler(args, { http }) {
    const account = await getFinanceAccount(http, args.accountId);
    const required =
      account.type === 'Checking' ? (account.balance < 0 ? OVERDRAFT_FIELDS : undefined) : REQUIRED_FIELDS_BY_TYPE[account.type];

    if (!required) {
      return textResult(`"${account.name}" is a ${account.type} account — no debt fields are required for it.`, {
        account,
        missing: [],
      });
    }

    const missing = required.filter((f) => account[f.key] === null || account[f.key] === undefined);

    if (missing.length === 0) {
      return textResult(`"${account.name}" has everything the Debt/Affordability features need.`, {
        account,
        missing: [],
      });
    }

    const lines = [
      `# "${account.name}" is missing ${missing.length} field(s)`,
      '',
      ...missing.map((f) => `- **${f.label}** — ${f.why}`),
    ];
    return textResult(lines.join('\n'), { account, missing: missing.map((f) => f.key) });
  },
});
