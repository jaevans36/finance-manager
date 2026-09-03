import { useState } from 'react';
import { savingsGoalService } from '../../services/savings-goal-service';
import type { CreateSavingsGoalRequest } from '../../types/finance';

interface SavingsGoalFormProps {
  onSuccess: () => void;
}

function monthsUntil(targetDate: Date): number {
  const today = new Date();
  const months = (targetDate.getFullYear() - today.getFullYear()) * 12
    + (targetDate.getMonth() - today.getMonth())
    - (targetDate.getDate() < today.getDate() ? 1 : 0);
  return Math.max(1, months);
}

export function SavingsGoalForm({ onSuccess }: SavingsGoalFormProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedTargetForHint = parseFloat(targetAmount);
  const suggestedContribution = targetDate && !isNaN(parsedTargetForHint) && parsedTargetForHint > 0
    ? Math.ceil((parsedTargetForHint / monthsUntil(new Date(targetDate))) * 100) / 100
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedContribution = parseFloat(monthlyContribution);

    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(parsedTarget) || parsedTarget <= 0) { setError('Target amount must be greater than zero.'); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      const request: CreateSavingsGoalRequest = {
        name: name.trim(),
        targetAmount: parsedTarget,
        monthlyContribution: isNaN(parsedContribution) ? 0 : parsedContribution,
        targetDate: targetDate || undefined,
      };
      await savingsGoalService.createGoal(request);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Goal name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Holiday, Emergency fund"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target amount (£)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            placeholder="Target amount"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly contribution (£)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyContribution}
            onChange={e => setMonthlyContribution(e.target.value)}
            placeholder="Monthly amount"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Target date (optional)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suggestedContribution != null && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Suggested: £{suggestedContribution.toFixed(2)}/month to reach this by{' '}
            {new Date(targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}
            <button
              type="button"
              onClick={() => setMonthlyContribution(suggestedContribution.toFixed(2))}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use this
            </button>
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save goal'}
      </button>
    </form>
  );
}
