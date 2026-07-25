import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { potService } from '../../services/pot-service';
import type { SpendingPotWithProgress } from '../../types/finance';
import { cn } from '../../lib/utils';

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

interface SpendingPotsProps {
  onAddPot?: () => void;
}

export function SpendingPots({ onAddPot }: SpendingPotsProps) {
  const now = new Date();
  const [pots, setPots] = useState<SpendingPotWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributingId, setContributingId] = useState<string | null>(null);

  const load = () => {
    potService.getPots(now.getMonth() + 1, now.getFullYear())
      .then(setPots)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load pots'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleContribute = async (potId: string) => {
    setContributingId(potId);
    try {
      await potService.contributeSinkingFund(potId);
      load();
    } finally {
      setContributingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load spending pots: {error}
      </div>
    );
  }

  if (pots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No spending pots set up.</p>
        {onAddPot && (
          <button
            onClick={onAddPot}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create a pot
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {pots.map(pot => (
        pot.type === 'SinkingFund'
          ? (
            <SinkingFundCard
              key={pot.id}
              pot={pot}
              onContribute={() => handleContribute(pot.id)}
              isContributing={contributingId === pot.id}
            />
          )
          : <PotCard key={pot.id} pot={pot} />
      ))}
    </div>
  );
}

function SinkingFundCard({
  pot,
  onContribute,
  isContributing,
}: {
  pot: SpendingPotWithProgress;
  onContribute: () => void;
  isContributing: boolean;
}) {
  const widthPct = Math.min(pot.percentageUsed, 100);

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
      style={pot.colour ? { borderLeftColor: pot.colour, borderLeftWidth: 4 } : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {pot.name}
        </span>
        {pot.isReady ? (
          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex-shrink-0 ml-2">
            <Check size={11} /> Ready
          </span>
        ) : pot.monthsRemaining != null && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex-shrink-0 ml-2">
            Ready in {pot.monthsRemaining}m
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {fmtGbp(pot.annualAmount ?? 0)}/yr · {fmtGbp(pot.monthlyAllocation ?? 0)}/mo
        {pot.nextPaymentDate && <> · due {new Date(pot.nextPaymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
      </p>

      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-1.5 rounded-full transition-all', pot.isReady ? 'bg-green-500' : 'bg-purple-500')}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {fmtGbp(pot.accumulatedAmount)} of {fmtGbp(pot.annualAmount ?? 0)} saved
        </span>
        <button
          onClick={onContribute}
          disabled={isContributing || pot.isReady}
          className="text-xs font-medium px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 disabled:opacity-50"
        >
          {isContributing ? '…' : pot.isReady ? 'Ready' : 'Set aside this month'}
        </button>
      </div>
    </div>
  );
}

function PotCard({ pot }: { pot: SpendingPotWithProgress }) {
  const barColour = pot.isExceeded
    ? 'bg-red-500'
    : pot.isWarning
      ? 'bg-amber-500'
      : 'bg-green-500';

  const widthPct = Math.min(pot.percentageUsed, 100);

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
      style={pot.colour ? { borderLeftColor: pot.colour, borderLeftWidth: 4 } : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {pot.name}
        </span>
        {pot.rolloverEnabled && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0 ml-2">
            Rollover
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Budget: £{pot.budgetAmount.toFixed(2)}
      </p>

      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColour)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          £{pot.spent.toFixed(2)} spent
        </span>
        <span className={cn(
          'font-medium',
          pot.remaining < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        )}>
          £{Math.abs(pot.remaining).toFixed(2)} {pot.remaining < 0 ? 'over' : 'left'}
        </span>
      </div>
    </div>
  );
}
