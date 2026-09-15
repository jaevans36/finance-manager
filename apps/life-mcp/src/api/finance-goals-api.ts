import type { AxiosInstance } from 'axios';
import type { SavingsGoalWithProjection, UpdateSavingsGoalInput } from '../types/finance-goal.js';

const BASE = '/api/v1/finance/goals';

export async function listSavingsGoals(http: AxiosInstance): Promise<SavingsGoalWithProjection[]> {
  const res = await http.get<SavingsGoalWithProjection[]>(BASE);
  return res.data;
}

export async function updateSavingsGoal(
  http: AxiosInstance,
  goalId: string,
  input: UpdateSavingsGoalInput,
): Promise<SavingsGoalWithProjection> {
  const res = await http.put<SavingsGoalWithProjection>(`${BASE}/${goalId}`, input);
  return res.data;
}
