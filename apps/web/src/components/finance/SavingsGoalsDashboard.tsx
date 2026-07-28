import { useEffect, useState } from 'react';
import { savingsGoalService } from '../../services/savings-goal-service';
import type { SavingsGoalWithProjection } from '../../types/finance';
import { cn } from '../../lib/utils';

interface SavingsGoalsDashboardProps {
  onAddGoal?: () => void;
}

export function SavingsGoalsDashboard({ onAddGoal }: SavingsGoalsDashboardProps) {
  const [goals, setGoals] = useState<SavingsGoalWithProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    savingsGoalService
      .getGoals()
      .then(setGoals)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load goals'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load savings goals: {error}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No savings goals yet.</p>
        {onAddGoal && (
          <button
            onClick={onAddGoal}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create a goal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {goals.map(g => <GoalCard key={g.goal.id} projection={g} />)}
    </div>
  );
}

function GoalCard({ projection: p }: { projection: SavingsGoalWithProjection }) {
  const barColour = p.goal.status === 'Achieved'
    ? 'bg-green-500'
    : p.isOnTrack
      ? 'bg-blue-500'
      : 'bg-amber-500';

  const widthPct = Math.min(p.percentageComplete, 100);

  const projectedLabel = p.goal.status === 'Achieved'
    ? 'Achieved!'
    : p.projectedCompletionDate
      ? `On track · ${p.monthsToTarget}m to go`
      : 'Set a monthly contribution to project';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {p.goal.name}
        </span>
        {p.goal.status === 'Achieved' && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex-shrink-0 ml-2">
            Achieved
          </span>
        )}
        {p.goal.status !== 'Achieved' && !p.isOnTrack && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex-shrink-0 ml-2">
            Behind
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        £{p.goal.currentAmount.toFixed(2)} of £{p.goal.targetAmount.toFixed(2)}
      </p>

      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColour)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{p.percentageComplete.toFixed(0)}% complete</span>
        <span className={cn(
          'font-medium',
          p.goal.status === 'Achieved'
            ? 'text-green-600 dark:text-green-400'
            : p.isOnTrack
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-amber-600 dark:text-amber-400'
        )}>
          {projectedLabel}
        </span>
      </div>
    </div>
  );
}
