import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { budgetService } from '../../services/budget-service';
import type { Budget } from '../../types/finance';
import { cn } from '../../lib/utils';

interface BudgetDashboardProps {
  onAddBudget?: () => void;
  onEdit?: (budget: Budget) => void;
}

export function BudgetDashboard({ onAddBudget, onEdit }: BudgetDashboardProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [hasPreviousMonthBudgets, setHasPreviousMonthBudgets] = useState(false);

  const load = () => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    return Promise.all([
      budgetService.getCurrentBudgets(),
      budgetService.getBudgets(prevMonth, prevYear).catch(() => [] as Budget[]),
    ])
      .then(([current, previous]) => {
        setBudgets(current);
        setHasPreviousMonthBudgets(previous.length > 0);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load budgets'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await budgetService.deleteBudget(id);
      setConfirmDeleteId(null);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch {
      setDeleteError('Failed to delete budget. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    setIsCopying(true);
    setCopyError(null);
    try {
      const now = new Date();
      await budgetService.copyFromPrevious(now.getMonth() + 1, now.getFullYear());
      setIsLoading(true);
      await load();
    } catch {
      setCopyError('Failed to copy last month’s budgets. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

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
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 gap-2">
        <p className="text-sm">No budgets set for this month.</p>
        {hasPreviousMonthBudgets && (
          <button
            onClick={handleCopyFromPrevious}
            disabled={isCopying}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {isCopying ? 'Copying…' : "Copy last month's budgets"}
          </button>
        )}
        {copyError && <p className="text-xs text-red-600 dark:text-red-400">{copyError}</p>}
        {onAddBudget && (
          <button
            onClick={onAddBudget}
            className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add your first budget
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasPreviousMonthBudgets && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleCopyFromPrevious}
            disabled={isCopying}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {isCopying ? 'Copying…' : "Copy any missing budgets from last month"}
          </button>
        </div>
      )}
      {copyError && <p className="text-xs text-red-600 dark:text-red-400">{copyError}</p>}
      {budgets.map(budget => (
        <BudgetProgressRow
          key={budget.id}
          budget={budget}
          isConfirmingDelete={confirmDeleteId === budget.id}
          isDeleting={isDeleting}
          deleteError={confirmDeleteId === budget.id ? deleteError : null}
          onEdit={() => { setConfirmDeleteId(null); onEdit?.(budget); }}
          onDeleteClick={() => { setDeleteError(null); setConfirmDeleteId(confirmDeleteId === budget.id ? null : budget.id); }}
          onConfirmDelete={() => handleDelete(budget.id)}
          onCancelDelete={() => { setConfirmDeleteId(null); setDeleteError(null); }}
        />
      ))}
    </div>
  );
}

interface BudgetProgressRowProps {
  budget: Budget;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  onEdit: () => void;
  onDeleteClick: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function BudgetProgressRow({
  budget,
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onEdit,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: BudgetProgressRowProps) {
  const barColour = budget.isExceeded
    ? 'bg-red-500'
    : budget.isWarning
      ? 'bg-amber-500'
      : 'bg-green-500';

  const widthPct = Math.min(budget.percentageUsed, 100);
  const overspend = budget.spent - budget.amount;
  const displayName = budget.title || budget.categoryName || 'Uncategorised';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {displayName}
          </span>
          {budget.title && budget.categoryName && (
            <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">{budget.categoryName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            £{budget.spent.toFixed(2)} / £{budget.amount.toFixed(2)}
          </span>
          <button
            onClick={onEdit}
            title="Edit budget"
            className="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDeleteClick}
            title="Delete budget"
            className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
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

      {budget.note && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{budget.note}</p>
      )}

      {isConfirmingDelete && (
        <div className="mt-3 -mx-4 -mb-4 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950/20 px-4 py-3 rounded-b-lg">
          <p className="text-sm text-red-700 dark:text-red-400 mb-2">
            Delete <strong>{displayName}</strong>? This cannot be undone.
          </p>
          {deleteError && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2">{deleteError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
