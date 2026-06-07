import { useEffect, useState } from 'react';
import { billService } from '../../services/bill-service';
import type { UpcomingBill } from '../../types/finance';
import { cn } from '../../lib/utils';

const FREQUENCY_LABEL: Record<string, string> = {
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Annual: 'Annual',
};

interface BillsDashboardProps {
  onAddBill?: () => void;
}

export function BillsDashboard({ onAddBill }: BillsDashboardProps) {
  const [upcoming, setUpcoming] = useState<UpcomingBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billService
      .getUpcoming(30)
      .then(setUpcoming)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load bills'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load bills: {error}
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No upcoming bills in the next 30 days.</p>
        {onAddBill && (
          <button
            onClick={onAddBill}
            className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add a bill
          </button>
        )}
      </div>
    );
  }

  const monthlyTotal = upcoming.reduce((sum, u) => {
    if (u.bill.frequency === 'Monthly') return sum + u.bill.amount;
    if (u.bill.frequency === 'Weekly') return sum + u.bill.amount * 4.33;
    if (u.bill.frequency === 'Quarterly') return sum + u.bill.amount / 3;
    if (u.bill.frequency === 'Annual') return sum + u.bill.amount / 12;
    return sum;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly recurring total: <span className="font-semibold text-gray-900 dark:text-gray-100">£{monthlyTotal.toFixed(2)}</span>
        </p>
      </div>

      <div className="space-y-2">
        {upcoming.map(u => (
          <BillRow key={u.bill.id} upcoming={u} />
        ))}
      </div>
    </div>
  );
}

function BillRow({ upcoming: u }: { upcoming: UpcomingBill }) {
  const dueLabel = u.daysUntilDue === 0
    ? 'Due today'
    : u.daysUntilDue === 1
      ? 'Due tomorrow'
      : `Due in ${u.daysUntilDue} days`;

  return (
    <div className={cn(
      'flex items-center justify-between rounded-xl border p-4',
      u.isReminderDue
        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    )}>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.bill.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {FREQUENCY_LABEL[u.bill.frequency]} · {dueLabel}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          £{u.bill.amount.toFixed(2)}
        </p>
        {u.bill.isPaid && (
          <span className="text-xs text-green-600 dark:text-green-400">Paid</span>
        )}
      </div>
    </div>
  );
}
