import financeApiClient from './finance-api-client';
import type {
  CreateSavingsGoalRequest,
  SavingsGoalWithProjection,
  UpdateSavingsGoalRequest,
} from '../types/finance';

export const savingsGoalService = {
  getGoals(): Promise<SavingsGoalWithProjection[]> {
    return financeApiClient
      .get<SavingsGoalWithProjection[]>('/api/v1/finance/goals')
      .then(r => r.data);
  },

  createGoal(data: CreateSavingsGoalRequest): Promise<SavingsGoalWithProjection> {
    return financeApiClient
      .post<SavingsGoalWithProjection>('/api/v1/finance/goals', data)
      .then(r => r.data);
  },

  updateGoal(id: string, data: UpdateSavingsGoalRequest): Promise<SavingsGoalWithProjection> {
    return financeApiClient
      .put<SavingsGoalWithProjection>(`/api/v1/finance/goals/${id}`, data)
      .then(r => r.data);
  },

  contribute(id: string, amount: number): Promise<SavingsGoalWithProjection> {
    return financeApiClient
      .post<SavingsGoalWithProjection>(`/api/v1/finance/goals/${id}/contribute`, { amount })
      .then(r => r.data);
  },

  deleteGoal(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/goals/${id}`).then(() => undefined);
  },
};
