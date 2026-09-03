import { useState } from 'react';
import { potService } from '../../services/pot-service';
import type { Category, CreateSpendingPotRequest, PotType } from '../../types/finance';

const POT_TYPES: { value: PotType; label: string }[] = [
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'EatingOut', label: 'Eating Out' },
  { value: 'Kids', label: 'Kids' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Bills', label: 'Bills' },
  { value: 'Subscriptions', label: 'Subscriptions' },
  { value: 'Savings', label: 'Savings' },
  { value: 'EmergencyFund', label: 'Emergency Fund' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Custom', label: 'Custom' },
  { value: 'SinkingFund', label: 'Sinking fund (annual cost, spread monthly)' },
];

interface PotFormProps {
  categories: Category[];
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PotForm({ categories, onSuccess, onCancel }: PotFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PotType>('Custom');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [annualAmount, setAnnualAmount] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSinkingFund = type === 'SinkingFund';
  const parsedAnnual = parseFloat(annualAmount);
  const monthlyAllocation = !isNaN(parsedAnnual) && parsedAnnual > 0 ? parsedAnnual / 12 : null;

  const toggleCategory = (id: string) => {
    setCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }

    if (isSinkingFund) {
      if (isNaN(parsedAnnual) || parsedAnnual <= 0) { setError('Annual amount must be greater than zero.'); return; }
    } else {
      const parsedBudget = parseFloat(budgetAmount);
      if (isNaN(parsedBudget) || parsedBudget <= 0) { setError('Budget amount must be greater than zero.'); return; }
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const request: CreateSpendingPotRequest = isSinkingFund
        ? {
            name: name.trim(), type, budgetAmount: 0, rolloverEnabled: false, categoryIds: [],
            annualAmount: parsedAnnual, nextPaymentDate: nextPaymentDate || undefined,
          }
        : {
            name: name.trim(), type, budgetAmount: parseFloat(budgetAmount), rolloverEnabled,
            categoryIds: Array.from(categoryIds),
          };
      await potService.createPot(request);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save pot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Groceries, Car insurance"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as PotType)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {POT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {isSinkingFund ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Annual amount (£)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={annualAmount}
                onChange={e => setAnnualAmount(e.target.value)}
                placeholder="e.g. 600"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next payment date (optional)
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={e => setNextPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {monthlyAllocation != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Monthly allocation: <span className="font-medium text-gray-700 dark:text-gray-300">£{monthlyAllocation.toFixed(2)}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly budget (£)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={budgetAmount}
              onChange={e => setBudgetAmount(e.target.value)}
              placeholder="Amount"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={rolloverEnabled}
              onChange={e => setRolloverEnabled(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
            />
            Roll over unused budget to next month
          </label>

          {categories.length > 0 && (
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categories that count towards this pot
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryIds.has(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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
          {isSubmitting ? 'Saving…' : 'Save pot'}
        </button>
      </div>
    </form>
  );
}
