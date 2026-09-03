import { useState } from 'react';
import { Repeat, MessageSquareText } from 'lucide-react';
import type { SubscriptionAuditItem, SubscriptionAuditResponse } from '../../types/finance';
import { cn } from '../../lib/utils';

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

interface SubscriptionAuditorProps {
  data: SubscriptionAuditResponse;
  onNegotiate: (merchantName: string) => void;
}

export function SubscriptionAuditor({ data, onNegotiate }: SubscriptionAuditorProps) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const markReviewed = (merchantName: string) =>
    setReviewed(prev => new Set([...prev, merchantName]));

  const visible = data.subscriptions.filter(s => !reviewed.has(s.merchantName));

  if (data.subscriptions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Subscriptions</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No recurring subscriptions detected yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Subscriptions</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {fmtGbp(data.totalMonthlyCost)}/month · {fmtGbp(data.totalAnnualCost)}/year across{' '}
          {data.subscriptions.length} subscription{data.subscriptions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="p-5 text-sm text-gray-500 dark:text-gray-400">All subscriptions reviewed.</p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map(item => (
            <SubscriptionRow
              key={item.merchantName}
              item={item}
              onReview={() => markReviewed(item.merchantName)}
              onNegotiate={() => onNegotiate(item.merchantName)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SubscriptionRow({
  item,
  onReview,
  onNegotiate,
}: {
  item: SubscriptionAuditItem;
  onReview: () => void;
  onNegotiate: () => void;
}) {
  return (
    <li className="p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.merchantName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {fmtGbp(item.monthlyCost)}/mo · {fmtGbp(item.annualCost)}/yr · {item.frequency}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {item.possiblyUnused && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400')}>
              Possibly unused
            </span>
          )}
          {item.amountTrend === 'Increasing' && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400')}>
              Price increasing
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={onNegotiate}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 inline-flex items-center gap-1"
        >
          <MessageSquareText size={12} /> Negotiate
        </button>
        <button
          onClick={onReview}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Reviewed
        </button>
      </div>
    </li>
  );
}
