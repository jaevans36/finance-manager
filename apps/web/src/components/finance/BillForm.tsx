import { useState } from 'react';
import { billService } from '../../services/bill-service';
import type { BillFrequency, CreateBillRequest } from '../../types/finance';

const FREQUENCIES: BillFrequency[] = ['Weekly', 'Monthly', 'Quarterly', 'Annual'];

interface BillFormProps {
  onSuccess: () => void;
  defaultName?: string;
  defaultAmount?: number;
  defaultFrequency?: BillFrequency;
}

export function BillForm({ onSuccess, defaultName = '', defaultAmount, defaultFrequency = 'Monthly' }: BillFormProps) {
  const [name, setName] = useState(defaultName);
  const [amount, setAmount] = useState(defaultAmount?.toString() ?? '');
  const [frequency, setFrequency] = useState<BillFrequency>(defaultFrequency);
  const [dueDay, setDueDay] = useState('1');
  const [reminderDays, setReminderDays] = useState('3');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be greater than zero.'); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      const request: CreateBillRequest = {
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        dueDay: parseInt(dueDay, 10),
        reminderDaysBefore: parseInt(reminderDays, 10),
      };
      await billService.createBill(request);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Netflix, Electricity"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount (£)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value as BillFrequency)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FREQUENCIES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due day (1–31)
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Remind me (days before)
          </label>
          <input
            type="number"
            min="0"
            max="30"
            value={reminderDays}
            onChange={e => setReminderDays(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save bill'}
      </button>
    </form>
  );
}
