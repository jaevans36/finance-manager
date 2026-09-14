import type { AxiosInstance } from 'axios';
import type { SavingsGoalWithProjection } from '../types/finance-goal.js';

const BASE = '/api/v1/finance/goals';

export async function listSavingsGoals(http: AxiosInstance): Promise<SavingsGoalWithProjection[]> {
  const res = await http.get<SavingsGoalWithProjection[]>(BASE);
  return res.data;
}
