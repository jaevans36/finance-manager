import type { AxiosInstance } from 'axios';
import type { SpendingPotWithProgress, UpdatePotInput } from '../types/finance-pot.js';

const BASE = '/api/v1/finance/pots';

export interface GetPotsParams {
  month?: number;
  year?: number;
}

export async function getPotBalances(
  http: AxiosInstance,
  params: GetPotsParams = {},
): Promise<SpendingPotWithProgress[]> {
  const res = await http.get<SpendingPotWithProgress[]>(BASE, { params });
  return res.data;
}

export async function updatePot(
  http: AxiosInstance,
  potId: string,
  input: UpdatePotInput,
): Promise<SpendingPotWithProgress> {
  const res = await http.put<SpendingPotWithProgress>(`${BASE}/${potId}`, input);
  return res.data;
}
