import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import type { Transaction, PagedResult } from '../../types/finance';
import { cn } from '../../lib/utils';

interface TransactionListProps {
  data: PagedResult<Transaction> | null;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

function formatAmount(amount: number, type: Transaction['type'], currency: string): string {
  const sign = type === 'Credit' ? '+' : '-';
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  return `${sign}${formatted}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(dateStr)
  );
}

export function TransactionList({
  data,
  isLoading,
  page,
  onPageChange,
  onTransactionClick,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Tag className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No transactions found</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.totalCount / data.pageSize);

  return (
    <div className="space-y-1">
      {data.items.map((tx) => (
        <button
          key={tx.id}
          onClick={() => onTransactionClick?.(tx)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        >
          {/* Reviewed indicator */}
          <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', tx.isReviewed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600')} />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {tx.payee ?? tx.description}
              </span>
              {tx.isRecurring && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0">
                  recurring
                </span>
              )}
              {tx.isDuplicate && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex-shrink-0">
                  duplicate
                </span>
              )}
            </div>
            {tx.payee && tx.description && tx.description.toLowerCase() !== tx.payee.toLowerCase() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {tx.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.transactionDate)}</span>
              {tx.categoryName && (
                <span className="text-xs text-gray-400 dark:text-gray-500">· {tx.categoryName}</span>
              )}
            </div>
          </div>

          {/* Amount */}
          <span
            className={cn(
              'text-sm font-medium flex-shrink-0 tabular-nums',
              tx.type === 'Credit'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {formatAmount(tx.amount, tx.type, tx.currency)}
          </span>
        </button>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <span>{data.totalCount} transactions</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
