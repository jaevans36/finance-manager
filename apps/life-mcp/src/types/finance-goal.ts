/** Mirrors apps/finance-api/Features/SavingsGoals/Controllers/GoalsController.cs DTOs. */

export const SAVINGS_GOAL_STATUSES = ['Active', 'Achieved', 'Abandoned'] as const;
export type SavingsGoalStatus = (typeof SAVINGS_GOAL_STATUSES)[number];

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

/** GET /api/v1/finance/goals response item — the raw goal is nested, not flattened. */
export interface SavingsGoalWithProjection {
  goal: SavingsGoal;
  percentageComplete: number;
  monthsToTarget: number;
  projectedCompletionDate: string | null;
  isOnTrack: boolean;
}

/** PUT /api/v1/finance/goals/{id} body — all fields optional, only what's passed changes. */
export interface UpdateSavingsGoalInput {
  name?: string;
  targetAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
}
