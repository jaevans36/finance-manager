/** Mirrors apps/finance-api/Features/Budgets/Controllers/PotsController.cs DTOs. */

export const POT_TYPES = [
  'Groceries',
  'Fuel',
  'EatingOut',
  'Kids',
  'Clothing',
  'Entertainment',
  'Bills',
  'Subscriptions',
  'Savings',
  'EmergencyFund',
  'Holiday',
  'Custom',
  'SinkingFund',
] as const;
export type PotType = (typeof POT_TYPES)[number];

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
  annualAmount: number | null;
  nextPaymentDate: string | null;
  accumulatedAmount: number;
  monthlyAllocation: number | null;
  monthsRemaining: number | null;
  isReady: boolean;
}
