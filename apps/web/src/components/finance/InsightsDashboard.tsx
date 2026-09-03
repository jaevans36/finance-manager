import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { insightsService } from '../../services/insights-service';
import type {
  AnomalyAlert as AnomalyAlertType,
  InsightCard,
  SpendingVelocityResponse,
  SubscriptionAuditResponse,
} from '../../types/finance';
import { SpendingVelocity } from './SpendingVelocity';
import { AnomalyAlerts } from './AnomalyAlert';
import { SubscriptionAuditor } from './SubscriptionAuditor';
import { NegotiationHelper, type NegotiationRequest } from './NegotiationHelper';
import { cn } from '../../lib/utils';

function CardSeverityDot({ severity }: { severity: InsightCard['severity'] }) {
  const colours: Record<InsightCard['severity'], string> = {
    Info: 'bg-blue-500',
    Warning: 'bg-amber-500',
    Critical: 'bg-red-500',
  };
  return <span className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', colours[severity])} />;
}

function InsightCardTile({ card }: { card: InsightCard }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
      <CardSeverityDot severity={card.severity} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{card.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.summary}</p>
      </div>
    </div>
  );
}

export function InsightsDashboard() {
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [velocity, setVelocity] = useState<SpendingVelocityResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyAlertType[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [negotiationRequest, setNegotiationRequest] = useState<NegotiationRequest | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      insightsService.getSummary(),
      insightsService.getVelocity(),
      insightsService.getAnomalies(),
      insightsService.getSubscriptions(),
    ])
      .then(([summary, velocityData, anomalyData, subscriptionData]) => {
        setCards(summary.cards);
        setVelocity(velocityData);
        setAnomalies(anomalyData);
        setSubscriptions(subscriptionData);
      })
      .catch(() => setError('Failed to load insights.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleNegotiate = (merchantName: string) =>
    setNegotiationRequest(prev => ({ merchant: merchantName, requestId: (prev?.requestId ?? 0) + 1 }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading insights…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const merchants = subscriptions?.subscriptions.map(s => s.merchantName) ?? [];

  return (
    <div className="space-y-6">
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map(card => (
            <InsightCardTile key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No insights yet — import more transaction history to unlock spending analysis.
          </p>
        </div>
      )}

      {velocity && <SpendingVelocity data={velocity} />}

      <AnomalyAlerts alerts={anomalies} />

      {subscriptions && <SubscriptionAuditor data={subscriptions} onNegotiate={handleNegotiate} />}

      <NegotiationHelper merchants={merchants} request={negotiationRequest} />
    </div>
  );
}
