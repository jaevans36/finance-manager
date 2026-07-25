import financeApiClient from './finance-api-client';
import type { AffordabilityData } from '../types/finance';

export const affordabilityService = {
  getAffordability(): Promise<AffordabilityData> {
    return financeApiClient
      .get<AffordabilityData>('/api/v1/finance/affordability')
      .then(r => r.data);
  },

  updateIncomeAccounts(accountIds: string[]): Promise<void> {
    return financeApiClient
      .put('/api/v1/finance/affordability/income-accounts', { accountIds })
      .then(() => undefined);
  },
};
