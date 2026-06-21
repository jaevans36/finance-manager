import { Trophy, Calendar, TrendingDown } from 'lucide-react';
import type { DebtProjectionResponse } from '../../types/finance';
import { cn } from '../../lib/utils';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatFreedomDate(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  if (!year || !month) return yyyyMm;
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

interface DebtProjectionPanelProps {
  projection: DebtProjectionResponse;
}

export function DebtProjectionPanel({ projection }: DebtProjectionPanelProps) {
  const { monthsToFreedom, estimatedFreedomDate, totalInterestPaid, payoffOrder, strategy } = projection;

  const years = Math.floor(monthsToFreedom / 12);
  const months = monthsToFreedom % 12;
  const timeLabel = years > 0
    ? `${years} yr${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
    : `${months} month${months !== 1 ? 's' : ''}`;

  const strategyLabel: Record<string, string> = {
    Avalanche: 'Avalanche (highest rate first)',
    Snowball: 'Snowball (smallest balance first)',
    Custom: 'Custom allocations',
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{timeLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">to debt freedom</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatFreedomDate(estimatedFreedomDate)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">estimated freedom date</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {fmt(totalInterestPaid)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">total interest paid</p>
        </div>
      </div>

      {/* Strategy used */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Strategy: <span className="font-medium">{strategyLabel[strategy] ?? strategy}</span>
      </p>

      {/* Payoff order */}
      {payoffOrder.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Payoff order</h4>
          <ol className="space-y-2">
            {payoffOrder.map((item, i) => (
              <li key={item.accountId} className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0',
                    i === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {item.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFreedomDate(item.paidOffDate)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
