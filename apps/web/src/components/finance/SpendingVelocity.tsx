import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { SpendingVelocityResponse } from '../../types/finance';
import { cn } from '../../lib/utils';

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

interface SpendingVelocityProps {
  data: SpendingVelocityResponse;
}

export function SpendingVelocity({ data }: SpendingVelocityProps) {
  const hasBudget = data.budgetTotal != null;
  const pct =
    hasBudget && data.budgetTotal! > 0
      ? Math.min(100, Math.round((data.totalSpentSoFar / data.budgetTotal!) * 100))
      : null;
  const overspending = (data.projectedOverspend ?? 0) > 0;
  const barColour =
    pct == null
      ? 'bg-blue-500'
      : pct >= 100
        ? 'bg-red-500'
        : pct >= 75
          ? 'bg-orange-400'
          : pct >= 50
            ? 'bg-amber-400'
            : 'bg-green-500';

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Spending velocity</h3>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold tabular-nums">{fmtGbp(data.totalSpentSoFar)}</span> spent in{' '}
        {data.daysElapsed} day{data.daysElapsed !== 1 ? 's' : ''} — projected{' '}
        <span className="font-semibold tabular-nums">{fmtGbp(data.projectedMonthEndTotal)}</span> by month end.
      </p>

      {hasBudget && pct != null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Budget pace</span>
            <span className="font-medium">{pct}% of {fmtGbp(data.budgetTotal!)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className={cn('h-1.5 rounded-full transition-all', barColour)} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {overspending && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">
            At this rate you&apos;re projected to overspend by {fmtGbp(data.projectedOverspend!)} this month.
          </p>
        </div>
      )}
    </div>
  );
}
