import { useState } from 'react';
import type { DebtStrategy, CustomAllocation, DebtAccountSummary } from '../../types/finance';
import { cn } from '../../lib/utils';

const strategies: { value: DebtStrategy; label: string; description: string }[] = [
  {
    value: 'Avalanche',
    label: 'Avalanche',
    description: 'Pay highest interest rate first. Minimises total interest paid.',
  },
  {
    value: 'Snowball',
    label: 'Snowball',
    description: 'Pay smallest balance first. Builds momentum with early wins.',
  },
  {
    value: 'Custom',
    label: 'Custom',
    description: 'Set a specific monthly payment for each debt.',
  },
];

interface DebtStrategySelectorProps {
  debts: DebtAccountSummary[];
  onSubmit: (
    strategy: DebtStrategy,
    extraMonthlyPayment: number | null,
    customAllocations: CustomAllocation[] | null,
    excludedAccountIds: string[]
  ) => void;
  isLoading?: boolean;
  initialExtraPayment?: number;
  suggestedPayment?: number;
}

export function DebtStrategySelector({
  debts,
  onSubmit,
  isLoading = false,
  initialExtraPayment = 0,
  suggestedPayment,
}: DebtStrategySelectorProps) {
  const [strategy, setStrategy] = useState<DebtStrategy>('Avalanche');
  const [extraPayment, setExtraPayment] = useState(
    initialExtraPayment > 0 ? String(initialExtraPayment) : ''
  );
  const [customAllocations, setCustomAllocations] = useState<Record<string, string>>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const toggleExclude = (accountId: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extra = extraPayment.trim() === '' ? null : parseFloat(extraPayment);
    const allocations =
      strategy === 'Custom'
        ? debts.map(d => ({
            accountId: d.accountId,
            monthlyPayment: parseFloat(customAllocations[d.accountId] ?? '0') || 0,
          }))
        : null;
    onSubmit(strategy, extra, allocations, Array.from(excludedIds));
  };

  const fieldClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Strategy picker */}
      <div>
        <p className={labelClass}>Strategy</p>
        <div className="grid grid-cols-3 gap-2">
          {strategies.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStrategy(s.value)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                strategy === s.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-gray-700 dark:text-gray-300 hover:border-primary/50'
              )}
            >
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400 leading-snug">
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Per-debt include/exclude — only when multiple debts and not Custom mode */}
      {debts.length > 1 && strategy !== 'Custom' && (
        <div>
          <p className={labelClass}>Debts to target</p>
          <p className="text-xs text-muted-foreground mb-2">
            Excluded debts still receive their minimum payment but won&apos;t receive any extra payments.
            Use this to skip debts you don&apos;t want to overpay (e.g. a mortgage on a fixed rate).
          </p>
          <div className="space-y-1">
            {debts.map(debt => {
              const isExcluded = excludedIds.has(debt.accountId);
              return (
                <label
                  key={debt.accountId}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                    isExcluded
                      ? 'border-border bg-card opacity-60'
                      : 'border-primary/30 bg-primary/5'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => toggleExclude(debt.accountId)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {debt.name}
                  </span>
                  <span className="text-xs text-gray-400">{debt.type}</span>
                  {debt.interestRate != null && (
                    <span className="text-xs text-gray-400">{debt.interestRate}%</span>
                  )}
                  {debt.promotionalExpiry && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Promo ends {debt.promotionalExpiry}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra monthly payment (not shown for Custom) */}
      {strategy !== 'Custom' && (
        <div>
          <label htmlFor="extra-payment" className={labelClass}>
            Monthly focus payment (£)
          </label>
          <input
            id="extra-payment"
            type="number"
            step="0.01"
            min="0"
            value={extraPayment}
            onChange={e => setExtraPayment(e.target.value)}
            placeholder="0 — pay minimums only"
            className={fieldClass}
          />
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              Applied in full to the target debt, on top of all minimum payments
            </p>
            {suggestedPayment != null && suggestedPayment > 0 && parseFloat(extraPayment) !== suggestedPayment && (
              <button
                type="button"
                onClick={() => setExtraPayment(String(suggestedPayment))}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                Reset to suggested ({new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(suggestedPayment)})
              </button>
            )}
          </div>

          {/* Total monthly commitment breakdown */}
          {(() => {
            const fmtGbp = (v: number) => new Intl.NumberFormat('en-GB', {
              style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0,
            }).format(v);
            const totalMins = debts
              .filter(d => !excludedIds.has(d.accountId))
              .reduce((sum, d) => {
                const current = d.currentMonthlyPayment ?? 0;
                return sum + (current > 0 ? current : (d.minimumMonthlyPayment ?? 0));
              }, 0);
            const extra = parseFloat(extraPayment) || 0;
            const targetDebt = strategy === 'Avalanche'
              ? [...debts].filter(d => !excludedIds.has(d.accountId))
                  .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0))[0]
              : [...debts].filter(d => !excludedIds.has(d.accountId))
                  .sort((a, b) => Math.abs(a.balance) - Math.abs(b.balance))[0];
            return (
              <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Minimums across all debts</span>
                  <span className="font-medium tabular-nums">{fmtGbp(totalMins)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Focus payment</span>
                  <span className="font-medium tabular-nums">{fmtGbp(extra)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200 border-t border-border pt-1">
                  <span>Total monthly out</span>
                  <span className="tabular-nums">{fmtGbp(totalMins + extra)}</span>
                </div>
                {targetDebt && extra > 0 && (
                  <p className="text-gray-400 dark:text-gray-500 pt-0.5">
                    Focus payment targets{' '}
                    <span className="font-medium text-gray-600 dark:text-gray-300">{targetDebt.name}</span> first
                    {strategy === 'Avalanche' && targetDebt.interestRate != null
                      ? ` (${targetDebt.interestRate}% APR — highest rate)`
                      : strategy === 'Snowball' ? ' (smallest balance)' : ''}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom allocations */}
      {strategy === 'Custom' && (
        <div className="space-y-2">
          <p className={labelClass}>Monthly payment per debt (£)</p>
          {debts.map(debt => (
            <div key={debt.accountId} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                {debt.name}
                <span className="text-xs text-gray-400 ml-1">
                  (min {debt.minimumMonthlyPayment != null
                    ? `£${debt.minimumMonthlyPayment}`
                    : '—'})
                </span>
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customAllocations[debt.accountId] ?? ''}
                onChange={e =>
                  setCustomAllocations(prev => ({
                    ...prev,
                    [debt.accountId]: e.target.value,
                  }))
                }
                placeholder={String(debt.minimumMonthlyPayment ?? 0)}
                className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? 'Calculating…' : 'Calculate projection'}
      </button>
    </form>
  );
}
