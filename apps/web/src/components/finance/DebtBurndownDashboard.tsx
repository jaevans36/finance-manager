import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { debtService } from '../../services/debt-service';
import type {
  DebtOverviewResponse,
  DebtProjectionResponse,
  DebtStrategy,
  CustomAllocation,
} from '../../types/finance';
import { DebtOverviewCard } from './DebtOverviewCard';
import { DebtStrategySelector } from './DebtStrategySelector';
import { DebtProjectionPanel } from './DebtProjectionPanel';
import { DebtWaterfallChart } from './DebtWaterfallChart';

interface DebtBurndownDashboardProps {
  suggestedExtraPayment?: number;
}

export function DebtBurndownDashboard({ suggestedExtraPayment = 0 }: DebtBurndownDashboardProps) {
  const [overview, setOverview] = useState<DebtOverviewResponse | null>(null);
  const [projection, setProjection] = useState<DebtProjectionResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOverviewLoading(true);
    debtService.getOverview()
      .then(data => {
        setOverview(data);
        // Auto-run Avalanche projection on load
        if (data.debts.length > 0) {
          return debtService.getProjection({
            strategy: 'Avalanche',
            extraMonthlyPayment: suggestedExtraPayment > 0 ? suggestedExtraPayment : null,
            customAllocations: null,
          }).then(setProjection);
        }
      })
      .catch(() => setError('Failed to load debt overview.'))
      .finally(() => setOverviewLoading(false));
  }, [suggestedExtraPayment]);

  const handleProjectionRequest = async (
    strategy: DebtStrategy,
    extraMonthlyPayment: number | null,
    customAllocations: CustomAllocation[] | null
  ) => {
    if (!overview) return;
    setProjectionLoading(true);
    try {
      const result = await debtService.getProjection({
        strategy,
        extraMonthlyPayment,
        customAllocations,
      });
      setProjection(result);
    } catch {
      setError('Failed to calculate projection.');
    } finally {
      setProjectionLoading(false);
    }
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading debt overview…</span>
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

  if (!overview) return null;

  return (
    <div className="space-y-6">
      <DebtOverviewCard
        debts={overview.debts}
        totalDebt={overview.totalDebt}
        totalMinimumPayments={overview.totalMinimumPayments}
        totalCurrentPayments={overview.totalCurrentPayments}
      />

      {overview.debts.length > 0 && (
        <>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Paydown calculator
            </h3>
            <DebtStrategySelector
              debts={overview.debts}
              onSubmit={handleProjectionRequest}
              isLoading={projectionLoading}
              initialExtraPayment={suggestedExtraPayment}
            />
          </div>

          {projection && (
            <>
              <DebtProjectionPanel projection={projection} />
              <DebtWaterfallChart
                schedule={projection.schedule}
                debts={overview.debts}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
