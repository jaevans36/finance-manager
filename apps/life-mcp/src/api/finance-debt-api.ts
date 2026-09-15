import type { AxiosInstance } from 'axios';
import type { DebtOverviewResponse, DebtProjectionResponse, ProjectionRequest } from '../types/finance-debt.js';

const BASE = '/api/v1/finance/debt';

export async function getDebtOverview(http: AxiosInstance): Promise<DebtOverviewResponse> {
  const res = await http.get<DebtOverviewResponse>(`${BASE}/overview`);
  return res.data;
}

export async function getDebtProjection(
  http: AxiosInstance,
  request: ProjectionRequest,
): Promise<DebtProjectionResponse> {
  const res = await http.post<DebtProjectionResponse>(`${BASE}/projection`, request);
  return res.data;
}
