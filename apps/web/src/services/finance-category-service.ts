import financeApiClient from './finance-api-client';
import type { Category } from '../types/finance';

export const financeCategoryService = {
  getCategories(): Promise<Category[]> {
    return financeApiClient
      .get<Category[]>('/api/v1/finance/categories')
      .then(r => r.data);
  },
};
