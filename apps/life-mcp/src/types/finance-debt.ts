/** Mirrors apps/finance-api/Features/Debt/Models/DebtModels.cs. */

export const DEBT_STRATEGIES = ['Avalanche', 'Snowball', 'Custom'] as const;
export type DebtStrategy = (typeof DEBT_STRATEGIES)[number];

export interface DebtAccountSummary {
  accountId: string;
  name: string;
  type: string;
  balance: number;
  creditLimit: number | null;
  interestRate: number | null;
  promotionalBalance: number | null;
  minimumMonthlyPayment: number | null;
  currentMonthlyPayment: number | null;
  promotionalRate: number | null;
  promotionalExpiry: string | null;
  loanEndDate: string | null;
  severityScore: number;
  severityLabel: string;
  severityReason: string | null;
  monthlyInterestCost: number | null;
  monthsToPayoffAtCurrentPayment: number | null;
  payoffDateAtCurrentPayment: string | null;
  detectedMonthlyPayment: number | null;
  effectiveMonthlyPayment: number | null;
}

export interface DebtOverviewResponse {
  debts: DebtAccountSummary[];
  totalDebt: number;
  totalMinimumPayments: number;
  totalCurrentPayments: number;
}

export interface CustomAllocation {
  accountId: string;
  monthlyPayment: number;
}

/** POST /api/v1/finance/debt/projection body. */
export interface ProjectionRequest {
  strategy: DebtStrategy;
  extraMonthlyPayment?: number;
  customAllocations?: CustomAllocation[];
  excludedAccountIds?: string[];
}

export interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
}

export interface AccountPayment {
  accountId: string;
  name: string;
  minimumPaid: number;
  extraPaid: number;
  totalPaid: number;
}

export interface DebtProjectionMonth {
  month: number;
  label: string;
  balances: AccountBalance[];
  totalRemaining: number;
  payments: AccountPayment[];
  totalPaidThisMonth: number;
  paidOffThisMonth: string[];
}

export interface PayoffOrder {
  accountId: string;
  name: string;
  monthPaidOff: number;
  paidOffDate: string;
}

export interface DebtProjectionResponse {
  strategy: DebtStrategy;
  monthsToFreedom: number;
  estimatedFreedomDate: string;
  totalInterestPaid: number;
  schedule: DebtProjectionMonth[];
  payoffOrder: PayoffOrder[];
  warnings: string[];
}
