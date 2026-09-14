import type { AxiosInstance } from 'axios';
import type { InsightsSummaryResponse } from '../types/finance-insight.js';

const BASE = '/api/v1/finance/insights';

export async function getInsightsSummary(http: AxiosInstance): Promise<InsightsSummaryResponse> {
  const res = await http.get<InsightsSummaryResponse>(BASE);
  return res.data;
}
