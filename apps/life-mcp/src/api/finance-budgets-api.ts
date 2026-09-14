import type { AxiosInstance } from 'axios';
import type { BudgetWithProgress } from '../types/finance-budget.js';

const BASE = '/api/v1/finance/budgets';

export async function getCurrentBudgets(http: AxiosInstance): Promise<BudgetWithProgress[]> {
  const res = await http.get<BudgetWithProgress[]>(`${BASE}/current`);
  return res.data;
}
