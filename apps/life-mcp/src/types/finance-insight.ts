/** Mirrors apps/finance-api/Features/Insights/Models/InsightsModels.cs. */

export const INSIGHT_TYPES = ['SpendingVelocity', 'Anomaly', 'Subscription', 'PriceIncrease'] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_SEVERITIES = ['Info', 'Warning', 'Critical'] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export interface InsightCard {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  summary: string;
  actionLabel: string | null;
}

export interface InsightsSummaryResponse {
  cards: InsightCard[];
}
