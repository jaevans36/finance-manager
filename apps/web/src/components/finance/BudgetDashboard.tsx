import { useEffect, useState } from 'react';
import { budgetService } from '../../services/budget-service';
import type { Budget } from '../../types/finance';
import { cn } from '../../lib/utils';

interface BudgetDashboardProps {
  onAddBudget?: () => void;
}

export function BudgetDashboard({ onAddBudget }: BudgetDashboardProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    budgetService.getCurrentBudgets()
      .then(setBudgets)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load budgets'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load budgets: {error}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No budgets set for this month.</p>
        {onAddBudget && (
          <button
            onClick={onAddBudget}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add your first budget
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map(budget => (
        <BudgetProgressRow key={budget.id} budget={budget} />
      ))}
    </div>
  );
}

function BudgetProgressRow({ budget }: { budget: Budget }) {
  const barColour = budget.isExceeded
    ? 'bg-red-500'
    : budget.isWarning
      ? 'bg-amber-500'
      : 'bg-green-500';

  const widthPct = Math.min(budget.percentageUsed, 100);
  const overspend = budget.spent - budget.amount;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {budget.categoryName ?? 'Uncategorised'}
        </span>
        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
          £{budget.spent.toFixed(2)} / £{budget.amount.toFixed(2)}
        </span>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-2 rounded-full transition-all', barColour)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      {budget.isExceeded && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Over by £{overspend.toFixed(2)}
        </p>
      )}
    </div>
  );
}
