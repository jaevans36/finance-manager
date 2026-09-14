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
