import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { billService } from '../../services/bill-service';
import { accountsService } from '../../services/accounts-service';
import type { AccountSummary, AccountType, BillFrequency, Category, CreateBillRequest } from '../../types/finance';
import { monthlyEquivalentAmount } from '../../lib/finance-format';

const DEBT_TYPES: AccountType[] = ['Credit', 'Loan', 'Mortgage'];

const FREQUENCIES: BillFrequency[] = ['Weekly', 'Monthly', 'Quarterly', 'Annual'];

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

interface BillFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  billId?: string;
  categories?: Category[];
  defaultName?: string;
  defaultDescription?: string;
  defaultAmount?: number;
  defaultFrequency?: BillFrequency;
  defaultDueDay?: number;
  defaultReminderDays?: number;
  defaultAccountId?: string;
  defaultCategoryId?: string;
}

export function BillForm({
  onSuccess, onCancel, billId, categories = [],
  defaultName = '', defaultDescription = '', defaultAmount,
  defaultFrequency = 'Monthly', defaultDueDay, defaultReminderDays,
  defaultAccountId, defaultCategoryId,
}: BillFormProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [amount, setAmount] = useState(defaultAmount?.toString() ?? '');
  const [frequency, setFrequency] = useState<BillFrequency>(defaultFrequency);
  const [dueDay, setDueDay] = useState(defaultDueDay?.toString() ?? '1');
  const [reminderDays, setReminderDays] = useState(defaultReminderDays?.toString() ?? '3');
  const [accountId, setAccountId] = useState<string>(defaultAccountId ?? '');
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId ?? '');
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Due day is a day-of-month (1-31) for Monthly/Quarterly/Annual bills, but an ISO
  // weekday (1=Monday..7=Sunday) for Weekly bills — reset to a sensible default
  // whenever frequency crosses that boundary so a leftover value isn't invalid.
  const handleFrequencyChange = (next: BillFrequency) => {
    const wasWeekly = frequency === 'Weekly';
    const isWeekly = next === 'Weekly';
    if (wasWeekly !== isWeekly) setDueDay('1');
    setFrequency(next);
  };

  useEffect(() => {
    accountsService.getAccounts()
      .then(setAccounts)
      .catch(() => { /* accounts are best-effort */ });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be greater than zero.'); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      if (billId) {
        await billService.updateBill(billId, {
          name: name.trim(),
          description: description.trim() || undefined,
          amount: parsedAmount,
          frequency,
          dueDay: parseInt(dueDay, 10),
          reminderDaysBefore: parseInt(reminderDays, 10),
          accountId: accountId || null,
          categoryId: categoryId || null,
        });
      } else {
        const request: CreateBillRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          amount: parsedAmount,
          frequency,
          dueDay: parseInt(dueDay, 10),
          reminderDaysBefore: parseInt(reminderDays, 10),
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
        };
        await billService.createBill(request);
      }
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Home broadband, Joint account direct debit"
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
            onChange={e => handleFrequencyChange(e.target.value as BillFrequency)}
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
            {frequency === 'Weekly' ? 'Due day' : 'Due day (1–31)'}
          </label>
          {frequency === 'Weekly' ? (
            <select
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WEEKDAYS.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
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

      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {accounts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Linked account <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Not linked</option>
            {(() => {
              const debtAccounts = accounts.filter(a => DEBT_TYPES.includes(a.type));
              const cashAccounts = accounts.filter(a => !DEBT_TYPES.includes(a.type));
              return (
                <>
                  {debtAccounts.length > 0 && (
                    <optgroup label="Pays debt account">
                      {debtAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                      ))}
                    </optgroup>
                  )}
                  {cashAccounts.length > 0 && (
                    <optgroup label="Debits from">
                      {cashAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </optgroup>
                  )}
                </>
              );
            })()}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Link to a credit card or loan and the debt projection will use this amount as the monthly payment.
          </p>
          {(() => {
            const selectedAccount = accounts.find(a => a.id === accountId);
            const parsedAmount = parseFloat(amount);
            if (!selectedAccount || !(selectedAccount.currentMonthlyPayment && selectedAccount.currentMonthlyPayment > 0) || isNaN(parsedAmount)) {
              return null;
            }
            const billMonthly = monthlyEquivalentAmount(parsedAmount, frequency);
            const mismatch = Math.abs(billMonthly - selectedAccount.currentMonthlyPayment) > 0.01;
            if (!mismatch) return null;
            return (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {selectedAccount.name} already shows £{selectedAccount.currentMonthlyPayment.toFixed(2)}/mo — this bill
                  works out to £{billMonthly.toFixed(2)}/mo. Check which is correct so they don&rsquo;t get double-counted.
                </span>
              </p>
            );
          })()}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : billId ? 'Save changes' : 'Save bill'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
