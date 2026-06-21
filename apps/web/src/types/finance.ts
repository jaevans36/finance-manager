// Finance Manager — shared TypeScript types
// Mirrors the Finance API models

export type AccountType =
  | 'Checking'
  | 'Savings'
  | 'Credit'
  | 'CashIsa'
  | 'StocksIsa'
  | 'Sipp'
  | 'PremiumBonds'
  | 'LifetimeIsa'
  | 'Investment'
  | 'Mortgage'
  | 'Loan'
  | 'Other';

export type TransactionType = 'Debit' | 'Credit' | 'Transfer';
export type ImportSource = 'Manual' | 'CsvImport' | 'BankSync';
export type BankFormat = 'barclays' | 'hsbc' | 'lloyds' | 'monzo' | 'starling' | 'natwest' | 'generic';

export interface CreditDetail {
  creditLimit?: number;
  interestRate?: number;
  promotionalBalance?: number;
  promotionalRate?: number;
  promotionalExpiry?: string;   // DateOnly serialised as "YYYY-MM-DD"
  promotionalRevertRate?: number;
}

export interface Account extends CreditDetail {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institution: string | null;
  accountNumberSuffix: string | null;
  isActive: boolean;
  excludeFromNetWorth: boolean;
  colour: string | null;
  icon: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary extends CreditDetail {
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
  mortgageStartDate?: string | null;   // DateOnly serialised as "YYYY-MM-DD"
  mortgageTermYears?: number | null;
  isInterestOnly?: boolean;
  minimumMonthlyPayment?: number | null;
  currentMonthlyPayment?: number | null;
  loanEndDate?: string | null;         // DateOnly serialised as "YYYY-MM-DD"
}

export interface CreateAccountRequest extends CreditDetail {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance?: number;
  institution?: string;
  accountNumberSuffix?: string;
  colour?: string;
  icon?: string;
  excludeFromNetWorth: boolean;
  notes?: string;
  mortgageStartDate?: string;
  mortgageTermYears?: number;
  isInterestOnly?: boolean;
  minimumMonthlyPayment?: number;
  currentMonthlyPayment?: number;
  loanEndDate?: string;
}

export interface UpdateAccountRequest extends CreditDetail {
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
  mortgageStartDate?: string;
  mortgageTermYears?: number;
  isInterestOnly?: boolean;
  minimumMonthlyPayment?: number | null;
  currentMonthlyPayment?: number | null;
  loanEndDate?: string | null;
}

export interface Category {
  id: string;
  name: string;
  colour: string | null;
  icon: string | null;
  isSystem: boolean;
  parentId: string | null;
  children: Category[] | null;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  payee: string | null;
  transactionDate: string;
  reference: string | null;
  isReviewed: boolean;
  isRecurring: boolean;
  isDuplicate: boolean;
  importSource: ImportSource;
  createdAt: string;
  notes: string | null;
}

export interface CreateTransactionRequest {
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description: string;
  payee?: string;
  transactionDate: string;
  postingDate?: string;
  reference?: string;
  notes?: string;
}

export interface UpdateTransactionRequest {
  categoryId?: string;
  description?: string;
  payee?: string;
  notes?: string;
  isReviewed?: boolean;
  type?: TransactionType;
  amount?: number;
  transactionDate?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CsvImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
  batchId: string;
  skipped: number;
  skipMessages: string[];
}

export interface NetWorthResponse {
  netWorth: number;
}

// ── Budget types ──────────────────────────────────────────────────────────────

export type PotType =
  | 'Groceries' | 'Fuel' | 'EatingOut' | 'Kids' | 'Clothing'
  | 'Entertainment' | 'Bills' | 'Subscriptions' | 'Savings'
  | 'EmergencyFund' | 'Holiday' | 'Custom';

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string | null;
  categoryColour: string | null;
  categoryIcon: string | null;
  month: number;
  year: number;
  amount: number;
  spent: number;
  rolloverFromPrevious: number;
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface CreateBudgetRequest {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
}

export interface UpdateBudgetRequest {
  amount?: number;
}

export interface CategoryBudgetSpend {
  categoryName: string;
  categoryColour: string | null;
  budgeted: number;
  spent: number;
}

export interface BudgetTrendPoint {
  month: number;
  year: number;
  monthLabel: string;
  categories: CategoryBudgetSpend[];
}

// ── Spending pot types ────────────────────────────────────────────────────────

export interface SpendingPotWithProgress {
  id: string;
  name: string;
  type: PotType;
  budgetAmount: number;
  spent: number;
  remaining: number;
  rolloverEnabled: boolean;
  icon: string | null;
  colour: string | null;
  categoryIds: string[];
  percentageUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface CreateSpendingPotRequest {
  name: string;
  type: PotType;
  budgetAmount: number;
  rolloverEnabled: boolean;
  icon?: string;
  colour?: string;
  categoryIds: string[];
}

export interface UpdateSpendingPotRequest {
  name?: string;
  budgetAmount?: number;
  rolloverEnabled?: boolean;
  icon?: string;
  colour?: string;
  categoryIds?: string[];
}

// ── Bill types ────────────────────────────────────────────────────────────────

export type BillFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
export type RecurringFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Unknown';
export type RecurringPatternType = 'FixedBill' | 'VariableBill' | 'Subscription' | 'RegularSpend';
export type AmountTrend = 'Stable' | 'Increasing' | 'Decreasing';

export interface Bill {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: BillFrequency;
  dueDay: number;
  reminderDaysBefore: number;
  isPaid: boolean;
  lastPaidDate: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  accountId: string | null;
  accountName: string | null;
}

export interface UpcomingBill {
  bill: Bill;
  nextDueDate: string;
  daysUntilDue: number;
  isReminderDue: boolean;
}

export interface RecurringPattern {
  merchantName: string;
  averageAmount: number;
  latestAmount: number;
  minAmount: number;
  maxAmount: number;
  detectedFrequency: RecurringFrequency;
  patternType: RecurringPatternType;
  amountTrend: AmountTrend;
  occurrencesInPeriod: number;
  lastOccurrence: string | null;
  isLikelyInactive: boolean;
}

export interface CreateBillRequest {
  name: string;
  amount: number;
  frequency: BillFrequency;
  dueDay: number;
  reminderDaysBefore: number;
  categoryId?: string;
  description?: string;
  accountId?: string;
}

export interface UpdateBillRequest {
  name?: string;
  amount?: number;
  frequency?: BillFrequency;
  dueDay?: number;
  reminderDaysBefore?: number;
  categoryId?: string;
  isActive?: boolean;
  description?: string;
  accountId?: string | null;
}

// ── Savings goal types ────────────────────────────────────────────────────────

export type SavingsGoalStatus = 'Active' | 'Achieved' | 'Abandoned';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  monthlyContribution: number;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalWithProjection {
  goal: SavingsGoal;
  percentageComplete: number;
  monthsToTarget: number;
  projectedCompletionDate: string | null;
  isOnTrack: boolean;
}

export interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  targetDate?: string;
  monthlyContribution: number;
}

export interface UpdateSavingsGoalRequest {
  name?: string;
  targetAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
}

// ── Debt types ────────────────────────────────────────────────────────────────

export type DebtStrategy = 'Avalanche' | 'Snowball' | 'Custom';
export type DebtSeverityLabel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface DebtAccountSummary {
  accountId: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number | null;
  minimumMonthlyPayment: number | null;
  currentMonthlyPayment: number | null;
  promotionalRate: number | null;
  promotionalExpiry: string | null;
  loanEndDate: string | null;
  severityScore: number;
  severityLabel: DebtSeverityLabel;
  severityReason: string | null;
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

export interface ProjectionRequest {
  strategy: DebtStrategy;
  extraMonthlyPayment: number | null;
  customAllocations: CustomAllocation[] | null;
}

export interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
}

export interface DebtProjectionMonth {
  month: number;
  label: string;
  balances: AccountBalance[];
  totalRemaining: number;
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
}

// ── Affordability types ───────────────────────────────────────────────────────

export type IncomeConfidence = 'High' | 'Medium' | 'Low';
export type IncomeSource = 'Detected' | 'Manual';

export interface AffordabilityData {
  monthlyIncome: number;
  incomeConfidence: IncomeConfidence;
  incomeSource: IncomeSource;
  committedCosts: number;
  discretionarySpend: number;
  emergencyBuffer: number;
  safeSurplus: number;
  suggestedDebtPayment: number;
  calculatedAt: string;
}
