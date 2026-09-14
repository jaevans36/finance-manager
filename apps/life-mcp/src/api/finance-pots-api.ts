import type { AxiosInstance } from 'axios';
import type { SpendingPotWithProgress } from '../types/finance-pot.js';

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
