import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { billService } from '../../services/bill-service';
import { BillForm } from './BillForm';
import type { Bill, Category, UpcomingBill } from '../../types/finance';
import { cn } from '../../lib/utils';

const FREQUENCY_LABEL: Record<string, string> = {
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Annual: 'Annual',
};

interface BillsDashboardProps {
  categories?: Category[];
  onAddBill?: () => void;
}

export function BillsDashboard({ categories = [], onAddBill }: BillsDashboardProps) {
  const [upcoming, setUpcoming] = useState<UpcomingBill[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    // 365-day window so every active bill gets a due date for sorting
    Promise.all([billService.getUpcoming(365), billService.getAllBills()])
      .then(([u, a]) => { setUpcoming(u); setAllBills(a); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load bills'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (bill: Bill) => {
    try {
      await billService.deleteBill(bill.id);
      setDeletingId(null);
      load();
    } catch {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (bill: Bill) => {
    setTogglingId(bill.id);
    try {
      await billService.setActive(bill.id, !bill.isActive, bill.accountId, bill.categoryId);
      load();
    } catch {
      // silently retry on next load
    } finally {
      setTogglingId(null);
    }
  };

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

  const active = allBills.filter(b => b.isActive);
  const inactive = allBills.filter(b => !b.isActive);
  const upcomingMap = new Map(upcoming.map(u => [u.bill.id, u]));

  const activeSorted = [...active].sort((a, b) => {
    const daysA = upcomingMap.get(a.id)?.daysUntilDue ?? 9999;
    const daysB = upcomingMap.get(b.id)?.daysUntilDue ?? 9999;
    return daysA - daysB;
  });

  const monthlyTotal = active.reduce((sum, b) => {
    if (b.frequency === 'Monthly') return sum + b.amount;
    if (b.frequency === 'Weekly') return sum + b.amount * 4.33;
    if (b.frequency === 'Quarterly') return sum + b.amount / 3;
    if (b.frequency === 'Annual') return sum + b.amount / 12;
    return sum;
  }, 0);

  const renderRow = (bill: Bill) => {
    if (editingBillId === bill.id) {
      return (
        <div key={bill.id} className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edit — {bill.name}</p>
            <button onClick={() => setEditingBillId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          <BillForm
            billId={bill.id}
            categories={categories}
            defaultName={bill.name}
            defaultDescription={bill.description ?? ''}
            defaultAmount={bill.amount}
            defaultFrequency={bill.frequency}
            defaultDueDay={bill.dueDay}
            defaultReminderDays={bill.reminderDaysBefore}
            defaultAccountId={bill.accountId ?? undefined}
            defaultCategoryId={bill.categoryId ?? undefined}
            onSuccess={() => { setEditingBillId(null); load(); }}
            onCancel={() => setEditingBillId(null)}
          />
        </div>
      );
    }
    return (
      <BillRow
        key={bill.id}
        bill={bill}
        upcoming={upcomingMap.get(bill.id)}
        onEdit={() => { setDeletingId(null); setEditingBillId(bill.id); }}
        onToggle={handleToggleActive}
        isToggling={togglingId === bill.id}
        confirmingDelete={deletingId === bill.id}
        onDeleteRequest={() => setDeletingId(bill.id)}
        onDeleteConfirm={() => handleDelete(bill)}
        onDeleteCancel={() => setDeletingId(null)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Single active bills list with due dates */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly recurring total:{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">£{monthlyTotal.toFixed(2)}</span>
        </p>

        {activeSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No active bills.</p>
            {onAddBill && (
              <button onClick={onAddBill} className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Add a bill
              </button>
            )}
          </div>
        ) : (
          activeSorted.map(renderRow)
        )}
      </div>

      {/* Inactive bills (collapsed by default) */}
      {inactive.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowInactive(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showInactive ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Inactive bills ({inactive.length})
          </button>
          {showInactive && inactive.map(renderRow)}
        </div>
      )}
    </div>
  );
}

function BillRow({
  bill,
  upcoming,
  onEdit,
  onToggle,
  isToggling,
  confirmingDelete,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  bill: Bill;
  upcoming: UpcomingBill | undefined;
  onEdit: () => void;
  onToggle: (bill: Bill) => void;
  isToggling: boolean;
  confirmingDelete: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const dueLabel = upcoming
    ? upcoming.daysUntilDue === 0
      ? 'Due today'
      : upcoming.daysUntilDue === 1
        ? 'Due tomorrow'
        : `Due in ${upcoming.daysUntilDue} days`
    : null;

  return (
    <div className={cn(
      'flex items-center justify-between rounded-xl border p-4',
      confirmingDelete
        ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
        : upcoming?.isReminderDue
          ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
          : bill.isActive
            ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-60'
    )}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{bill.name}</p>
        {bill.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{bill.description}</p>
        )}
        {confirmingDelete ? (
          <p className="text-xs text-red-600 dark:text-red-400">This will permanently delete the bill.</p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {FREQUENCY_LABEL[bill.frequency]}
            {dueLabel && <span> · {dueLabel}</span>}
            {bill.isPaid && <span className="ml-1 text-green-600 dark:text-green-400">· Paid</span>}
            {bill.categoryName && (
              <span className="ml-1 text-purple-600 dark:text-purple-400">· {bill.categoryName}</span>
            )}
            {bill.accountName
              ? <span className="ml-1 text-blue-600 dark:text-blue-400">· {bill.accountName}</span>
              : <span className="ml-1 text-gray-400 dark:text-gray-500">· Not linked</span>
            }
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">£{bill.amount.toFixed(2)}</p>
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDeleteConfirm}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onDeleteCancel}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit bill"
            >
              <Pencil size={13} />
            </button>
            {!bill.isActive && (
              <button
                onClick={onDeleteRequest}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Delete bill"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={() => onToggle(bill)}
              disabled={isToggling}
              className={cn(
                'text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50',
                bill.isActive
                  ? 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400'
                  : 'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
              )}
            >
              {isToggling ? '…' : bill.isActive ? 'Mark inactive' : 'Reactivate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
