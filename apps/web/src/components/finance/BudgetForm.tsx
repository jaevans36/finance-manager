import { useEffect, useState } from 'react';
import { budgetService } from '../../services/budget-service';
import type { Category } from '../../types/finance';
import { cn } from '../../lib/utils';

interface BudgetFormProps {
  categories: Category[];
  onSuccess: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  amount?: string;
}

export function BudgetForm({ categories, onSuccess, onCancel }: BudgetFormProps) {
  const now = new Date();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggested, setSuggested] = useState<{ amount: number; count: number } | null>(null);

  useEffect(() => {
    if (!categoryId) { setSuggested(null); return; }
    let cancelled = false;
    budgetService.getSuggested(categoryId)
      .then(res => {
        if (!cancelled) setSuggested(res.suggestedAmount != null ? { amount: res.suggestedAmount, count: res.transactionCount } : null);
      })
      .catch(() => { if (!cancelled) setSuggested(null); });
    return () => { cancelled = true; };
  }, [categoryId]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      next.amount = 'Amount is required and must be greater than zero';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await budgetService.createBudget({
        categoryId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        amount: parseFloat(amount),
      });
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Monthly budget (£)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className={cn(
            'w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.amount
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
        )}
        {!errors.amount && suggested && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Suggested: £{suggested.amount.toFixed(2)} based on the last 3 months ({suggested.count} transaction{suggested.count === 1 ? '' : 's'})
            {' · '}
            <button
              type="button"
              onClick={() => setAmount(suggested.amount.toFixed(2))}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use this
            </button>
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed: {submitError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save budget'}
        </button>
      </div>
    </form>
  );
}
