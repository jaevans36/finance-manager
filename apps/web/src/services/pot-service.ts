import financeApiClient from './finance-api-client';
import type {
  SpendingPotWithProgress,
  CreateSpendingPotRequest,
  UpdateSpendingPotRequest,
} from '../types/finance';

export const potService = {
  getPots(month: number, year: number): Promise<SpendingPotWithProgress[]> {
    return financeApiClient
      .get<SpendingPotWithProgress[]>('/api/v1/finance/pots', { params: { month, year } })
      .then(r => r.data);
  },

  createPot(data: CreateSpendingPotRequest): Promise<SpendingPotWithProgress> {
    return financeApiClient.post<SpendingPotWithProgress>('/api/v1/finance/pots', data).then(r => r.data);
  },

  updatePot(id: string, data: UpdateSpendingPotRequest): Promise<SpendingPotWithProgress> {
    return financeApiClient
      .put<SpendingPotWithProgress>(`/api/v1/finance/pots/${id}`, data)
      .then(r => r.data);
  },

  deletePot(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/pots/${id}`).then(() => undefined);
  },

  contributeSinkingFund(id: string): Promise<SpendingPotWithProgress> {
    return financeApiClient
      .post<SpendingPotWithProgress>(`/api/v1/finance/pots/${id}/contribute`)
      .then(r => r.data);
  },
};
