import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { debtService } from '../../services/debt-service';
import { affordabilityService } from '../../services/affordability-service';
import type {
  AffordabilityData,
  CustomAllocation,
  DebtOverviewResponse,
  DebtProjectionResponse,
  DebtStrategy,
} from '../../types/finance';
import { DebtOverviewCard } from './DebtOverviewCard';
import { DebtStrategySelector } from './DebtStrategySelector';
import { DebtProjectionPanel } from './DebtProjectionPanel';
import { DebtWaterfallChart } from './DebtWaterfallChart';
import { DebtMonthlyTable } from './DebtMonthlyTable';
import { IncomeStreamsEditor } from './IncomeStreamsEditor';
import { fmtGbp } from '../../lib/finance-format';

// ── Recommended payment card ──────────────────────────────────────────────────

interface RecommendedPaymentCardProps {
  affordability: AffordabilityData;
  onAffordabilityUpdated: (updated: AffordabilityData) => void;
}

function RecommendedPaymentCard({ affordability, onAffordabilityUpdated }: RecommendedPaymentCardProps) {
  const [managingIncome, setManagingIncome] = useState(false);

  const needsIncome =
    affordability.incomeConfidence === 'Low' &&
    affordability.incomeSource === 'Detected' &&
    affordability.monthlyIncome === 0;

  const refreshAffordability = async () => {
    onAffordabilityUpdated(await affordabilityService.getAffordability());
  };

  if (needsIncome) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Income not detected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Add your income sources below so we can calculate an affordable debt payment recommendation.
            </p>
          </div>
        </div>
        <IncomeStreamsEditor onChange={refreshAffordability} />
      </div>
    );
  }

  if (affordability.suggestedDebtPayment <= 0) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              No surplus available for debt repayment
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your committed bills, regular spending{affordability.plannedSavings > 0 ? ', and planned savings' : ''} appear to consume all of your income ({fmtGbp(affordability.monthlyIncome)}).
              Review your Bills tab to identify any that could be reduced or cancelled.
            </p>
            <button
              onClick={() => setManagingIncome(v => !v)}
              className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 underline hover:no-underline"
            >
              {managingIncome ? 'Hide income sources' : 'Manage income sources'}
            </button>
          </div>
        </div>
        {managingIncome && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
            <IncomeStreamsEditor onChange={refreshAffordability} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
            Recommended monthly payment
          </p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-300 mt-0.5">
            {fmtGbp(affordability.suggestedDebtPayment)}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            per month — pre-filled in the calculator below. Recalculates when your bills change.
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400 shrink-0 mt-1" />
      </div>

      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700 space-y-1">
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>
            Monthly income{' '}
            <span className="opacity-60">({affordability.incomeConfidence.toLowerCase()} confidence)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-medium tabular-nums">{fmtGbp(affordability.monthlyIncome)}</span>
            <button
              onClick={() => setManagingIncome(v => !v)}
              className="text-[11px] underline hover:no-underline opacity-80"
            >
              {managingIncome ? 'Hide' : 'Manage'}
            </button>
          </span>
        </div>
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Committed bills</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.committedCosts)}</span>
        </div>
        {affordability.existingDebtPayments > 0 && (
          <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
            <span>Existing debt repayments</span>
            <span className="font-medium tabular-nums">− {fmtGbp(affordability.existingDebtPayments)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Regular spending</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.discretionarySpend)}</span>
        </div>
        {affordability.plannedSavings > 0 && (
          <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
            <span>Planned savings & upcoming costs</span>
            <span className="font-medium tabular-nums">− {fmtGbp(affordability.plannedSavings)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Safety buffer</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.emergencyBuffer)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-800 dark:text-green-300 font-semibold border-t border-green-200 dark:border-green-700 pt-1 mt-1">
          <span>Safe surplus</span>
          <span className="tabular-nums">{fmtGbp(affordability.safeSurplus)}</span>
        </div>
      </div>

      {managingIncome && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <IncomeStreamsEditor onChange={refreshAffordability} />
        </div>
      )}

      <p className="mt-2 text-xs text-green-600 dark:text-green-500">
        We suggest 90% of your safe surplus, keeping 10% as breathing room.
      </p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function DebtBurndownDashboard() {
  const [overview, setOverview] = useState<DebtOverviewResponse | null>(null);
  const [affordability, setAffordability] = useState<AffordabilityData | null>(null);
  const [projection, setProjection] = useState<DebtProjectionResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExcludedIds, setLastExcludedIds] = useState<string[]>([]);

  useEffect(() => {
    setOverviewLoading(true);

    Promise.all([
      debtService.getOverview(),
      affordabilityService.getAffordability().catch(() => null),
    ])
      .then(([debtData, affordabilityData]) => {
        setOverview(debtData);
        setAffordability(affordabilityData);

        if (debtData.debts.length > 0) {
          const suggested = affordabilityData?.suggestedDebtPayment ?? 0;
          setProjectionLoading(true);
          return debtService
            .getProjection({
              strategy: 'Avalanche',
              extraMonthlyPayment: suggested > 0 ? suggested : null,
              customAllocations: null,
              excludedAccountIds: null,
            })
            .then(setProjection)
            .finally(() => setProjectionLoading(false));
        }
      })
      .catch(() => setError('Failed to load debt overview.'))
      .finally(() => setOverviewLoading(false));
  }, []);

  const handleProjectionRequest = async (
    strategy: DebtStrategy,
    extraMonthlyPayment: number | null,
    customAllocations: CustomAllocation[] | null,
    excludedAccountIds: string[] = []
  ) => {
    if (!overview) return;
    setLastExcludedIds(excludedAccountIds);
    setProjectionLoading(true);
    try {
      const result = await debtService.getProjection({
        strategy,
        extraMonthlyPayment,
        customAllocations,
        excludedAccountIds: excludedAccountIds.length > 0 ? excludedAccountIds : null,
      });
      setProjection(result);
    } catch {
      setError('Failed to calculate projection.');
    } finally {
      setProjectionLoading(false);
    }
  };

  const handleAffordabilityUpdated = (updated: AffordabilityData) => {
    setAffordability(updated);
    if (overview && overview.debts.length > 0) {
      const suggested = updated.suggestedDebtPayment;
      void handleProjectionRequest('Avalanche', suggested > 0 ? suggested : null, null, lastExcludedIds);
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

  const suggestedPayment = affordability?.suggestedDebtPayment ?? 0;

  return (
    <div className="space-y-6">
      {affordability && (
        <RecommendedPaymentCard
          affordability={affordability}
          onAffordabilityUpdated={handleAffordabilityUpdated}
        />
      )}

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
              initialExtraPayment={suggestedPayment}
              suggestedPayment={suggestedPayment}
            />
          </div>

          {projection && (
            <>
              <DebtProjectionPanel projection={projection} />
              <DebtWaterfallChart
                schedule={projection.schedule}
                debts={overview.debts}
              />
              <DebtMonthlyTable
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
