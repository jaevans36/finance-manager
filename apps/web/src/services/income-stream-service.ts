import financeApiClient from './finance-api-client';
import type {
  CreateIncomeStreamRequest,
  DetectedIncomeResponse,
  IncomeStream,
  UpdateIncomeStreamRequest,
} from '../types/finance';

export const incomeStreamService = {
  getStreams(): Promise<IncomeStream[]> {
    return financeApiClient.get<IncomeStream[]>('/api/v1/finance/income-streams').then(r => r.data);
  },

  createStream(data: CreateIncomeStreamRequest): Promise<IncomeStream> {
    return financeApiClient.post<IncomeStream>('/api/v1/finance/income-streams', data).then(r => r.data);
  },

  updateStream(id: string, data: UpdateIncomeStreamRequest): Promise<IncomeStream> {
    return financeApiClient.put<IncomeStream>(`/api/v1/finance/income-streams/${id}`, data).then(r => r.data);
  },

  deleteStream(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/income-streams/${id}`).then(() => undefined);
  },

  detectFromAccount(accountId: string): Promise<DetectedIncomeResponse> {
    return financeApiClient
      .get<DetectedIncomeResponse>('/api/v1/finance/income-streams/detect', { params: { accountId } })
      .then(r => r.data);
  },
};
