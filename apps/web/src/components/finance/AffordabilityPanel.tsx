import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { affordabilityService } from '../../services/affordability-service';
import type { AffordabilityData, IncomeConfidence } from '../../types/finance';
import { cn } from '../../lib/utils';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function ConfidenceBadge({ confidence }: { confidence: IncomeConfidence }) {
  const variants: Record<IncomeConfidence, { label: string; className: string }> = {
    High: { label: 'High confidence', className: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
    Medium: { label: 'Medium confidence', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    Low: { label: 'Low confidence', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  };
  const v = variants[confidence];
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', v.className)}>
      {v.label}
    </span>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className={cn('text-sm', muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300')}>
        {label}
      </span>
      <span className={cn('text-sm font-medium tabular-nums', muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100')}>
        {value}
      </span>
    </div>
  );
}

interface AffordabilityPanelProps {
  onSurplusChange?: (surplus: number) => void;
}

export function AffordabilityPanel({ onSurplusChange }: AffordabilityPanelProps) {
  const [data, setData] = useState<AffordabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  const load = async () => {
    try {
      const result = await affordabilityService.getAffordability();
      setData(result);
      onSurplusChange?.(result.suggestedDebtPayment);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load affordability data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput);
    if (isNaN(parsed) || parsed < 0) return;
    setIsSavingIncome(true);
    try {
      await affordabilityService.updateManualIncome(parsed);
      setEditingIncome(false);
      setIsLoading(true);
      await load();
    } catch {
      // ignore — user can retry
    } finally {
      setIsSavingIncome(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Calculating affordability…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const needsManualIncome = data.incomeConfidence === 'Low' && data.incomeSource === 'Detected' && data.monthlyIncome === 0;

  return (
    <div className="space-y-4">
      {/* Income card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly income</span>
          </div>
          <ConfidenceBadge confidence={data.incomeConfidence} />
        </div>

        {needsManualIncome ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                We couldn't detect your income from recent transactions. Enter your monthly take-home pay so we can calculate an accurate surplus.
              </span>
            </div>
            {editingIncome ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  placeholder="Monthly income (£)"
                  min="0"
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveIncome}
                  disabled={isSavingIncome}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingIncome ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingIncome(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingIncome(true); setIncomeInput(''); }}
                className="w-full rounded-lg border border-dashed border-blue-300 dark:border-blue-700 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
              >
                Enter monthly income
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {fmt(data.monthlyIncome)}
            </span>
            <div className="flex items-center gap-2">
              {data.incomeSource === 'Manual' && (
                <span className="text-xs text-gray-400 dark:text-gray-500">Manual</span>
              )}
              <button
                onClick={() => { setEditingIncome(true); setIncomeInput(data.monthlyIncome.toString()); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {!needsManualIncome && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly breakdown</span>
          </div>
          <div>
            <Row label="Income" value={fmt(data.monthlyIncome)} />
            <Row label="Committed costs (bills)" value={`− ${fmt(data.committedCosts)}`} />
            <Row label="Discretionary spend" value={`− ${fmt(data.discretionarySpend)}`} />
            <Row label="Emergency buffer" value={`− ${fmt(data.emergencyBuffer)}`} muted />
          </div>
        </div>
      )}

      {/* Safe surplus */}
      {!needsManualIncome && (
        <div className={cn(
          'rounded-xl border p-4',
          data.safeSurplus > 0
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
            : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className={cn(
              'h-4 w-4',
              data.safeSurplus > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
            )} />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Safe monthly surplus</span>
          </div>
          <p className={cn(
            'text-3xl font-bold',
            data.safeSurplus > 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
          )}>
            {fmt(data.safeSurplus)}
          </p>
          {data.safeSurplus > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Suggested debt payment: <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(data.suggestedDebtPayment)}/mo</span>
            </p>
          )}
          {data.safeSurplus === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Your committed costs exceed your income. Review your bills and budgets.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
