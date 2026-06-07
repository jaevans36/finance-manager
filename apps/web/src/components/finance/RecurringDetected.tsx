import { useEffect, useState } from 'react';
import { billService } from '../../services/bill-service';
import type { RecurringPattern } from '../../types/finance';
import { cn } from '../../lib/utils';

const TREND_BADGE: Record<string, { label: string; className: string }> = {
  Stable: { label: 'Stable', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  Increasing: { label: 'Increasing', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  Decreasing: { label: 'Decreasing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
};

const PATTERN_LABEL: Record<string, string> = {
  Subscription: 'Subscription',
  FixedBill: 'Fixed bill',
  VariableBill: 'Variable bill',
  RegularSpend: 'Regular spend',
};

interface RecurringDetectedProps {
  onConfirmAsBill?: (pattern: RecurringPattern) => void;
}

export function RecurringDetected({ onConfirmAsBill }: RecurringDetectedProps) {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDetected, setHasDetected] = useState(false);

  const detect = () => {
    setIsLoading(true);
    setError(null);
    billService
      .detectRecurring()
      .then(p => { setPatterns(p); setHasDetected(true); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Detection failed'))
      .finally(() => setIsLoading(false));
  };

  const visible = patterns.filter(p => !dismissed.has(p.merchantName));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Auto-detected recurring payments
        </h3>
        <button
          onClick={detect}
          disabled={isLoading}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {isLoading ? 'Scanning…' : 'Scan transactions'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {hasDetected && visible.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          No recurring payments detected.
        </p>
      )}

      {visible.map(p => {
        const trend = TREND_BADGE[p.amountTrend] ?? TREND_BADGE.Stable;
        return (
          <div
            key={p.merchantName}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {p.merchantName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {PATTERN_LABEL[p.patternType]} · {p.detectedFrequency} · avg £{p.averageAmount.toFixed(2)}
                </p>
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0', trend.className)}>
                {trend.label}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onConfirmAsBill?.(p)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirm as bill
              </button>
              <button
                onClick={() => setDismissed(prev => new Set([...prev, p.merchantName]))}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
