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
    customAllocations: CustomAllocation[] | null
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
    onSubmit(strategy, extra, allocations);
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

      {/* Extra monthly payment (not shown for Custom) */}
      {strategy !== 'Custom' && (
        <div>
          <label htmlFor="extra-payment" className={labelClass}>
            Extra monthly payment (£)
          </label>
          <input
            id="extra-payment"
            type="number"
            step="1"
            min="0"
            value={extraPayment}
            onChange={e => setExtraPayment(e.target.value)}
            placeholder="0 — pay minimums only"
            className={fieldClass}
          />
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              Amount above your minimums to throw at the priority debt each month
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
                step="1"
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
