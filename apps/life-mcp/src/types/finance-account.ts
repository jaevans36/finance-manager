/** Mirrors apps/finance-api/Features/Accounts/Services/IAccountService.cs (AccountSummary). */

export const ACCOUNT_TYPES = [
  'Checking',
  'Savings',
  'Credit',
  'CashIsa',
  'StocksIsa',
  'Sipp',
  'PremiumBonds',
  'LifetimeIsa',
  'Investment',
  'Mortgage',
  'Loan',
  'Other',
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institution: string | null;
  colour: string | null;
  icon: string | null;
  isActive: boolean;
  excludeFromNetWorth: boolean;
  creditLimit: number | null;
  interestRate: number | null;
  promotionalBalance: number | null;
  promotionalRate: number | null;
  promotionalExpiry: string | null;
  promotionalRevertRate: number | null;
  mortgageStartDate: string | null;
  mortgageTermYears: number | null;
  isInterestOnly: boolean;
  minimumMonthlyPayment: number | null;
  currentMonthlyPayment: number | null;
  loanEndDate: string | null;
}

/** GET /api/v1/finance/accounts/net-worth */
export interface NetWorthResponse {
  netWorth: number;
}

/**
 * PATCH /api/v1/finance/accounts/{id} body — every field optional, omitted = unchanged.
 * Mirrors UpdateAccountRequest in apps/finance-api/Features/Accounts/Services/IAccountService.cs exactly.
 */
export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  institution?: string;
  accountNumberSuffix?: string;
  isActive?: boolean;
  colour?: string;
  icon?: string;
  excludeFromNetWorth?: boolean;
  notes?: string;
  creditLimit?: number;
  interestRate?: number;
  promotionalBalance?: number;
  promotionalRate?: number;
  promotionalExpiry?: string;
  promotionalRevertRate?: number;
  mortgageStartDate?: string;
  mortgageTermYears?: number;
  isInterestOnly?: boolean;
  minimumMonthlyPayment?: number;
  currentMonthlyPayment?: number;
  loanEndDate?: string;
}
