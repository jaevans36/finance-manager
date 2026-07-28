import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { transactionsService } from '../../services/transactions-service';
import type { Transaction, Category, TransactionType } from '../../types/finance';
import { cn } from '../../lib/utils';

interface TransactionDetailPanelProps {
  transaction: Transaction;
  categories: Category[];
  onClose: () => void;
  onUpdated: (updated: Transaction) => void;
  onDeleted?: () => void;
}

const SOURCE_LABELS: Record<Transaction['importSource'], string> = {
  Manual: 'Manual entry',
  CsvImport: 'CSV import',
  BankSync: 'Bank sync',
};

export function TransactionDetailPanel({
  transaction,
  categories,
  onClose,
  onUpdated,
  onDeleted,
}: TransactionDetailPanelProps) {
  const [description, setDescription] = useState(transaction.description);
  const [date, setDate] = useState(transaction.transactionDate);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? '');
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) { setError('Description is required'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be a positive number'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const updated = await transactionsService.updateTransaction(transaction.id, {
        description: description.trim(),
        transactionDate: date,
        amount: parsedAmount,
        type,
        categoryId: categoryId || undefined,
        notes: notes || undefined,
        isReviewed: true,
      });
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await transactionsService.deleteTransaction(transaction.id);
      onDeleted?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const fieldClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              transaction.importSource === 'Manual'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            )}>
              {SOURCE_LABELS[transaction.importSource]}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="space-y-0.5">
          {transaction.payee && (
            <p className="font-semibold text-foreground">{transaction.payee}</p>
          )}
          <p className="text-sm text-muted-foreground">£{transaction.amount.toFixed(2)}</p>
          {transaction.payee && transaction.payee !== transaction.description && (
            <p className="text-xs text-muted-foreground">{transaction.description}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="tx-description" className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <input
            id="tx-description"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Amount + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-amount" className="block text-sm font-medium text-foreground mb-1">
              Amount (£)
            </label>
            <input
              id="tx-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="tx-type" className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <select
              id="tx-type"
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
          <label htmlFor="tx-date" className="block text-sm font-medium text-foreground mb-1">
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="tx-category" className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            id="tx-category"
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
          <label htmlFor="tx-notes" className="block text-sm font-medium text-foreground mb-1">
            Notes
          </label>
          <textarea
            id="tx-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className={`${fieldClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isLoading || isDeleting}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading || isDeleting}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Delete */}
        <div className="border-t border-border pt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex-1">Delete this transaction?</p>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
