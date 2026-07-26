import { useState } from 'react';
import { X } from 'lucide-react';
import { billService } from '../../services/bill-service';
import { BillForm } from './BillForm';
import type { BillFrequency, Category, RecurringPattern } from '../../types/finance';
import { cn } from '../../lib/utils';

/** 1 = Monday .. 7 = Sunday (ISO 8601), converted from JS's 0 = Sunday .. 6 = Saturday. */
function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

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

const FREQ_LABEL: Record<string, string> = {
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Annual: 'Annual',
  Unknown: 'Unknown',
};

interface RecurringDetectedProps {
  categories?: Category[];
  onBillSaved?: () => void;
}

export function RecurringDetected({ categories = [], onBillSaved }: RecurringDetectedProps) {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDetected, setHasDetected] = useState(false);

  const detect = () => {
    setIsLoading(true);
    setError(null);
    billService
      .detectRecurring(365)
      .then(p => { setPatterns(p); setHasDetected(true); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Detection failed'))
      .finally(() => setIsLoading(false));
  };

  // Same merchant can now appear once per account it was detected on, so the
  // merchant name alone is no longer a unique identifier for a pattern.
  const patternKey = (p: RecurringPattern) => `${p.merchantName}::${p.accountId}`;

  const dismiss = (key: string) =>
    setDismissed(prev => new Set([...prev, key]));

  const visible = patterns.filter(p => !dismissed.has(patternKey(p)));
  const active = visible.filter(p => !p.isLikelyInactive);
  const likelyInactive = visible.filter(p => p.isLikelyInactive);

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
          {isLoading ? 'Scanning…' : hasDetected ? 'Re-scan' : 'Scan transactions'}
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

      {active.length > 0 && (
        <div className="space-y-2">
          {active.map(p => (
            <PatternCard
              key={patternKey(p)}
              pattern={p}
              categories={categories}
              onDismiss={() => dismiss(patternKey(p))}
              onBillSaved={onBillSaved}
            />
          ))}
        </div>
      )}

      {likelyInactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide pt-2">
            Possibly no longer active
          </p>
          {likelyInactive.map(p => (
            <PatternCard
              key={patternKey(p)}
              pattern={p}
              categories={categories}
              onDismiss={() => dismiss(patternKey(p))}
              onBillSaved={onBillSaved}
              inactive
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PatternCard({
  pattern: p,
  categories = [],
  onDismiss,
  onBillSaved,
  inactive = false,
}: {
  pattern: RecurringPattern;
  categories?: Category[];
  onDismiss: () => void;
  onBillSaved?: () => void;
  inactive?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const trend = TREND_BADGE[p.amountTrend] ?? TREND_BADGE.Stable;
  const lastSeen = p.lastOccurrence
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(p.lastOccurrence))
    : null;

  const defaultFrequency: BillFrequency =
    p.detectedFrequency !== 'Unknown' ? (p.detectedFrequency as BillFrequency) : 'Monthly';
  const defaultDueDay = p.lastOccurrence
    ? defaultFrequency === 'Weekly'
      ? isoWeekday(new Date(p.lastOccurrence))
      : parseInt(p.lastOccurrence.split('-')[2], 10)
    : undefined;

  if (confirming) {
    return (
      <div className={cn(
        'rounded-xl border p-4',
        inactive
          ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
          : 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10'
      )}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Confirm as bill — {p.merchantName}
          </p>
          <button
            onClick={() => setConfirming(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Pre-filled from detected pattern — adjust as needed.
        </p>
        <BillForm
          categories={categories}
          defaultName={p.merchantName}
          defaultAmount={p.latestAmount}
          defaultFrequency={defaultFrequency}
          defaultDueDay={defaultDueDay}
          defaultAccountId={p.accountId}
          onSuccess={() => { setConfirming(false); onDismiss(); onBillSaved?.(); }}
          onCancel={() => setConfirming(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border p-4',
      inactive
        ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-75'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {p.merchantName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {PATTERN_LABEL[p.patternType]} · {FREQ_LABEL[p.detectedFrequency]} ·{' '}
            <span className="text-blue-600 dark:text-blue-400">{p.accountName}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Latest: <span className="font-medium text-gray-700 dark:text-gray-300">£{p.latestAmount.toFixed(2)}</span>
            {p.minAmount !== p.maxAmount && (
              <span className="ml-1.5 text-gray-400 dark:text-gray-500">(avg £{p.averageAmount.toFixed(2)}, range £{p.minAmount.toFixed(2)}–£{p.maxAmount.toFixed(2)})</span>
            )}
          </p>
          {lastSeen && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Last seen {lastSeen} · {p.occurrencesInPeriod} occurrence{p.occurrencesInPeriod !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', trend.className)}>
            {trend.label}
          </span>
          {inactive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Not seen recently
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {inactive ? 'Confirm (inactive)' : 'Confirm as bill'}
        </button>
        <button
          onClick={onDismiss}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
