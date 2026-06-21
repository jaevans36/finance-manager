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

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

// ── Recommended payment card ──────────────────────────────────────────────────

interface RecommendedPaymentCardProps {
  affordability: AffordabilityData;
  onAffordabilityUpdated: (updated: AffordabilityData) => void;
}

function RecommendedPaymentCard({ affordability, onAffordabilityUpdated }: RecommendedPaymentCardProps) {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const needsIncome =
    affordability.incomeConfidence === 'Low' &&
    affordability.incomeSource === 'Detected' &&
    affordability.monthlyIncome === 0;

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput);
    if (isNaN(parsed) || parsed < 0) return;
    setIsSaving(true);
    try {
      await affordabilityService.updateManualIncome(parsed);
      const updated = await affordabilityService.getAffordability();
      onAffordabilityUpdated(updated);
      setEditingIncome(false);
    } catch {
      // user can retry
    } finally {
      setIsSaving(false);
    }
  };

  if (needsIncome) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Income not detected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Enter your monthly take-home pay so we can calculate an affordable debt payment recommendation.
            </p>
          </div>
        </div>
        {editingIncome ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              placeholder="Monthly income (£)"
              min="0"
              autoFocus
              className="flex-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSaveIncome}
              disabled={isSaving}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditingIncome(false)}
              className="rounded-lg border border-amber-300 dark:border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingIncome(true); setIncomeInput(''); }}
            className="w-full rounded-lg border border-dashed border-amber-400 dark:border-amber-600 px-4 py-2 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
          >
            Enter monthly income
          </button>
        )}
      </div>
    );
  }

  if (affordability.suggestedDebtPayment <= 0) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              No surplus available for debt repayment
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your committed bills and regular spending appear to consume all of your income ({fmtGbp(affordability.monthlyIncome)}).
              Review your Bills tab to identify any that could be reduced or cancelled.
            </p>
          </div>
        </div>
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
          <span className="font-medium tabular-nums">{fmtGbp(affordability.monthlyIncome)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Less committed bills</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.committedCosts)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Less regular spending</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.discretionarySpend)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400">
          <span>Less safety buffer</span>
          <span className="font-medium tabular-nums">− {fmtGbp(affordability.emergencyBuffer)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-800 dark:text-green-300 font-semibold border-t border-green-200 dark:border-green-700 pt-1 mt-1">
          <span>Safe surplus</span>
          <span className="tabular-nums">{fmtGbp(affordability.safeSurplus)}</span>
        </div>
      </div>

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
    customAllocations: CustomAllocation[] | null
  ) => {
    if (!overview) return;
    setProjectionLoading(true);
    try {
      const result = await debtService.getProjection({ strategy, extraMonthlyPayment, customAllocations });
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
      void handleProjectionRequest('Avalanche', suggested > 0 ? suggested : null, null);
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
            </>
          )}
        </>
      )}
    </div>
  );
}
