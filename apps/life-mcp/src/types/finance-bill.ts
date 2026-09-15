/** Mirrors apps/finance-api/Features/Bills/Controllers/BillsController.cs DTOs. */

export const BILL_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Annual'] as const;
export type BillFrequency = (typeof BILL_FREQUENCIES)[number];

export interface BillResponse {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: BillFrequency;
  /** ISO day-of-week (1=Mon..7=Sun) when frequency is Weekly; day-of-month (1-31) otherwise. */
  dueDay: number;
  reminderDaysBefore: number;
  isPaid: boolean;
  lastPaidDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  accountId: string | null;
  accountName: string | null;
  linkedAccountPayment: number | null;
  hasPaymentMismatch: boolean;
}

export interface UpcomingBillResponse {
  bill: BillResponse;
  nextDueDate: string;
  daysUntilDue: number;
  isReminderDue: boolean;
}

/** POST /api/v1/finance/bills body. */
export interface CreateBillInput {
  name: string;
  amount: number;
  frequency: BillFrequency;
  /** ISO day-of-week (1=Mon..7=Sun) when frequency is Weekly; day-of-month (1-31) otherwise. */
  dueDay: number;
  reminderDaysBefore: number;
  categoryId?: string;
  description?: string;
  accountId?: string;
}

/** PUT /api/v1/finance/bills/{id} body — every field optional, omitted = unchanged. */
export interface UpdateBillInput {
  name?: string;
  amount?: number;
  frequency?: BillFrequency;
  dueDay?: number;
  reminderDaysBefore?: number;
  categoryId?: string;
  isActive?: boolean;
  description?: string;
  accountId?: string;
}

/** Mirrors apps/finance-api/Features/Bills/Models/RecurringPattern.cs. */
export const RECURRING_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Annual', 'Unknown'] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const RECURRING_PATTERN_TYPES = ['FixedBill', 'VariableBill', 'Subscription', 'RegularSpend'] as const;
export type RecurringPatternType = (typeof RECURRING_PATTERN_TYPES)[number];

export const AMOUNT_TRENDS = ['Stable', 'Increasing', 'Decreasing'] as const;
export type AmountTrend = (typeof AMOUNT_TRENDS)[number];

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
  accountId: string;
  accountName: string;
  isLikelyInactive: boolean;
}
