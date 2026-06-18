import { useState } from 'react';
import { transactionsService } from '../../services/transactions-service';
import type { Category, TransactionType } from '../../types/finance';

interface AddTransactionFormProps {
  accountId: string;
  categories: Category[];
  onAdded: () => void;
  onCancel: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionForm({ accountId, categories, onAdded, onCancel }: AddTransactionFormProps) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('Debit');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) { setError('Description is required'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be a positive number'); return; }
    if (!date) { setError('Date is required'); return; }

    setIsLoading(true);
    setError(null);
    try {
      await transactionsService.createTransaction({
        accountId,
        description: description.trim(),
        transactionDate: date,
        amount: parsedAmount,
        type,
        categoryId: categoryId || undefined,
        notes: notes.trim() || undefined,
      });
      onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description */}
      <div>
        <label htmlFor="add-tx-description" className="block text-sm font-medium text-foreground mb-1">
          Description <span className="text-destructive">*</span>
        </label>
        <input
          id="add-tx-description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. TESCO CARDIFF"
          className={fieldClass}
        />
      </div>

      {/* Amount + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="add-tx-amount" className="block text-sm font-medium text-foreground mb-1">
            Amount (£) <span className="text-destructive">*</span>
          </label>
          <input
            id="add-tx-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="add-tx-type" className="block text-sm font-medium text-foreground mb-1">
            Type <span className="text-destructive">*</span>
          </label>
          <select
            id="add-tx-type"
            value={type}
            onChange={e => setType(e.target.value as TransactionType)}
            className={fieldClass}
          >
            <option value="Debit">Debit (money out)</option>
            <option value="Credit">Credit (money in)</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="add-tx-date" className="block text-sm font-medium text-foreground mb-1">
          Date <span className="text-destructive">*</span>
        </label>
        <input
          id="add-tx-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="add-tx-category" className="block text-sm font-medium text-foreground mb-1">
          Category
        </label>
        <select
          id="add-tx-category"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className={fieldClass}
        >
          <option value="">Uncategorised</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="add-tx-notes" className="block text-sm font-medium text-foreground mb-1">
          Notes
        </label>
        <textarea
          id="add-tx-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional note…"
          rows={2}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Manual entries are excluded from duplicate detection — if you later re-import a CSV covering the same period, delete this entry first.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Adding…' : 'Add transaction'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
