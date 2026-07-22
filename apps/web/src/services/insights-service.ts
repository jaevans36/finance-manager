import financeApiClient from './finance-api-client';
import type {
  AnomalyAlert,
  InsightsSummaryResponse,
  NegotiationScriptResponse,
  SpendingVelocityResponse,
  SubscriptionAuditResponse,
} from '../types/finance';

export const insightsService = {
  getSummary(): Promise<InsightsSummaryResponse> {
    return financeApiClient
      .get<InsightsSummaryResponse>('/api/v1/finance/insights')
      .then(r => r.data);
  },

  getVelocity(): Promise<SpendingVelocityResponse> {
    return financeApiClient
      .get<SpendingVelocityResponse>('/api/v1/finance/insights/velocity')
      .then(r => r.data);
  },

  getAnomalies(): Promise<AnomalyAlert[]> {
    return financeApiClient
      .get<AnomalyAlert[]>('/api/v1/finance/insights/anomalies')
      .then(r => r.data);
  },

  getSubscriptions(): Promise<SubscriptionAuditResponse> {
    return financeApiClient
      .get<SubscriptionAuditResponse>('/api/v1/finance/insights/subscriptions')
      .then(r => r.data);
  },

  getNegotiationScript(merchantName: string): Promise<NegotiationScriptResponse> {
    return financeApiClient
      .get<NegotiationScriptResponse>('/api/v1/finance/insights/negotiation-script', {
        params: { merchantName },
      })
      .then(r => r.data);
  },
};
