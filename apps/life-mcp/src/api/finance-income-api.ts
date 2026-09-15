import type { AxiosInstance } from 'axios';
import type { IncomeStream } from '../types/finance-income.js';

const BASE = '/api/v1/finance/income-streams';

export async function listIncomeStreams(http: AxiosInstance): Promise<IncomeStream[]> {
  const res = await http.get<IncomeStream[]>(BASE);
  return res.data;
}
