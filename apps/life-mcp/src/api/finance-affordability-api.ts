import type { AxiosInstance } from 'axios';
import type { AffordabilityResponse } from '../types/finance-affordability.js';

const BASE = '/api/v1/finance/affordability';

export async function getAffordability(http: AxiosInstance): Promise<AffordabilityResponse> {
  const res = await http.get<AffordabilityResponse>(BASE);
  return res.data;
}

export async function updateIncomeAccounts(http: AxiosInstance, accountIds: string[]): Promise<void> {
  await http.put(`${BASE}/income-accounts`, { accountIds });
}
