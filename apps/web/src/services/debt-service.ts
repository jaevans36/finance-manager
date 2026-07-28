import financeApiClient from './finance-api-client';
import type {
  DebtOverviewResponse,
  DebtProjectionResponse,
  ProjectionRequest,
} from '../types/finance';

export const debtService = {
  getOverview(): Promise<DebtOverviewResponse> {
    return financeApiClient
      .get<DebtOverviewResponse>('/api/v1/finance/debt/overview')
      .then(r => r.data);
  },

  getProjection(request: ProjectionRequest): Promise<DebtProjectionResponse> {
    return financeApiClient
      .post<DebtProjectionResponse>('/api/v1/finance/debt/projection', request)
      .then(r => r.data);
  },
};
