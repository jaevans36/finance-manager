import { useState } from 'react';
import { X } from 'lucide-react';
import { transactionsService } from '../../services/transactions-service';
import type { Transaction, Category } from '../../types/finance';
import { cn } from '../../lib/utils';

interface TransactionDetailPanelProps {
  transaction: Transaction;
  categories: Category[];
  onClose: () => void;
  onUpdated: (updated: Transaction) => void;
}

function formatAmount(amount: number, type: Transaction['type']): string {
  const sign = type === 'Credit' ? '+' : '-';
  return `${sign}${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(dateStr));
}

export function TransactionDetailPanel({ transaction, categories, onClose, onUpdated }: TransactionDetailPanelProps) {
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await transactionsService.updateTransaction(transaction.id, {
        categoryId: categoryId || undefined,
        isReviewed: true,
        notes: notes || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">
              {transaction.payee ?? transaction.description}
            </p>
            {transaction.payee && transaction.description !== transaction.payee && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{transaction.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount + date */}
        <div className="flex items-center justify-between text-sm">
          <span className={cn(
            'text-lg font-bold tabular-nums',
            transaction.type === 'Credit' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
          )}>
            {formatAmount(transaction.amount, transaction.type)}
          </span>
          <span className="text-muted-foreground">{formatDate(transaction.transactionDate)}</span>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="detail-category" className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            id="detail-category"
            aria-label="Category"
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
          <label htmlFor="detail-notes" className="block text-sm font-medium text-foreground mb-1">
            Notes
          </label>
          <textarea
            id="detail-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className={`${fieldClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
