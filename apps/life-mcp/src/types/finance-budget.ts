/** Mirrors apps/finance-api/Features/Budgets/Controllers/BudgetsController.cs DTOs. */

export interface BudgetWithProgress {
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
  title: string | null;
  note: string | null;
}
