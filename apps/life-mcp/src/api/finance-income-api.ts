import type { AxiosInstance } from 'axios';
import type {
  CreateIncomeStreamInput,
  DetectedIncomeResponse,
  IncomeStream,
  UpdateIncomeStreamInput,
} from '../types/finance-income.js';

const BASE = '/api/v1/finance/income-streams';

export async function listIncomeStreams(http: AxiosInstance): Promise<IncomeStream[]> {
  const res = await http.get<IncomeStream[]>(BASE);
  return res.data;
}

export async function createIncomeStream(http: AxiosInstance, input: CreateIncomeStreamInput): Promise<IncomeStream> {
  const res = await http.post<IncomeStream>(BASE, input);
  return res.data;
}

export async function updateIncomeStream(
  http: AxiosInstance,
  streamId: string,
  input: UpdateIncomeStreamInput,
): Promise<IncomeStream> {
  const res = await http.put<IncomeStream>(`${BASE}/${streamId}`, input);
  return res.data;
}

export async function deleteIncomeStream(http: AxiosInstance, streamId: string): Promise<void> {
  await http.delete(`${BASE}/${streamId}`);
}

export async function detectIncome(http: AxiosInstance, accountId: string): Promise<DetectedIncomeResponse> {
  const res = await http.get<DetectedIncomeResponse>(`${BASE}/detect`, { params: { accountId } });
  return res.data;
}
