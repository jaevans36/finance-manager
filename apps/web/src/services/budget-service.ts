import financeApiClient from './finance-api-client';
import type {
  Budget,
  BudgetTrendPoint,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../types/finance';

export const budgetService = {
  getCurrentBudgets(): Promise<Budget[]> {
    return financeApiClient.get<Budget[]>('/api/v1/finance/budgets/current').then(r => r.data);
  },

  getBudgets(month: number, year: number): Promise<Budget[]> {
    return financeApiClient
      .get<Budget[]>('/api/v1/finance/budgets', { params: { month, year } })
      .then(r => r.data);
  },

  getTrends(months = 6): Promise<BudgetTrendPoint[]> {
    return financeApiClient
      .get<BudgetTrendPoint[]>('/api/v1/finance/budgets/trends', { params: { months } })
      .then(r => r.data);
  },

  createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return financeApiClient.post<Budget>('/api/v1/finance/budgets', data).then(r => r.data);
  },

  updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
    return financeApiClient.put<Budget>(`/api/v1/finance/budgets/${id}`, data).then(r => r.data);
  },

  deleteBudget(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/budgets/${id}`).then(() => undefined);
  },

  copyFromPrevious(month: number, year: number): Promise<Budget[]> {
    return financeApiClient
      .post<Budget[]>('/api/v1/finance/budgets/copy-from-previous', null, { params: { month, year } })
      .then(r => r.data);
  },
};
