import { useState } from 'react';
import { Target, Trophy } from 'lucide-react';
import type { DebtAccountSummary, DebtProjectionMonth } from '../../types/finance';
import { cn } from '../../lib/utils';

const DEBT_COLOURS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#3b82f6', '#a3e635',
];

const fmt = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

function formatMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  if (!year || !month) return yyyyMm;
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Fixed-width columns (not `fr`) so a wide breakdown (many debts) scrolls
// horizontally instead of squeezing every column below a readable width.
function gridColumns(debtCount: number, showBreakdown: boolean): string {
  const debtCols = showBreakdown ? Array(debtCount).fill('130px').join(' ') : '';
  return ['90px', debtCols, '130px', '120px', 'minmax(200px, 1fr)'].filter(Boolean).join(' ');
}

interface DebtMonthlyTableProps {
  schedule: DebtProjectionMonth[];
  debts: DebtAccountSummary[];
}

export function DebtMonthlyTable({ schedule, debts }: DebtMonthlyTableProps) {
  const [viewYears, setViewYears] = useState<number | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (schedule.length === 0) return null;

  const totalYears = Math.ceil(schedule.length / 12);
  const rangeOptions: { label: string; years: number | null }[] = [
    ...[2, 5, 10, 20].filter(y => y < totalYears).map(y => ({ label: `${y} yr`, years: y })),
    { label: 'All', years: null },
  ];

  const filtered = viewYears ? schedule.filter(m => m.month <= viewYears * 12) : schedule;
  const debtEntries = debts.map((d, i) => ({ name: d.name, colour: DEBT_COLOURS[i % DEBT_COLOURS.length] }));

  // Whichever debt is receiving the extra/"Focus" payment right now, on top of its minimum.
  const currentFocus = schedule[0]?.payments
    .filter(p => p.extraPaid > 0)
    .sort((a, b) => b.extraPaid - a.extraPaid)[0];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Monthly breakdown</h4>
        <div className="flex items-center gap-3">
          {debts.length > 1 && (
            <button
              type="button"
              onClick={() => setShowBreakdown(v => !v)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showBreakdown ? 'Hide per-debt breakdown' : 'Show per-debt breakdown'}
            </button>
          )}
          {rangeOptions.length > 1 && (
            <div className="flex gap-1">
              {rangeOptions.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setViewYears(opt.years)}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                    viewYears === opt.years
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentFocus && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <Target className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            This month&rsquo;s extra <strong>{fmt(currentFocus.extraPaid)}</strong> is going toward{' '}
            <strong>{currentFocus.name}</strong>, on top of its {fmt(currentFocus.minimumPaid)} minimum
            — {fmt(currentFocus.totalPaid)} total. Once it&rsquo;s paid off, this amount rolls onto the next debt.
          </span>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-border">
        <div className="min-w-fit">
          <div
            className="sticky top-0 z-10 grid gap-3 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: gridColumns(debtEntries.length, showBreakdown) }}
          >
            <span>Month</span>
            {showBreakdown && debtEntries.map(({ name, colour }) => (
              <span key={name} className="flex items-center gap-1.5 overflow-hidden" title={name}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colour }} />
                <span className="truncate">{name}</span>
              </span>
            ))}
            <span>Paid this month</span>
            <span>Remaining</span>
            <span>Milestone</span>
          </div>

          {filtered.map(m => (
            <div
              key={m.month}
              className={cn(
                'grid gap-3 px-3 py-2 text-xs border-t border-border items-start',
                m.paidOffThisMonth.length > 0 && 'bg-amber-50 dark:bg-amber-950/10',
              )}
              style={{ gridTemplateColumns: gridColumns(debtEntries.length, showBreakdown) }}
            >
              <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatMonthLabel(m.label)}</span>
              {showBreakdown && debtEntries.map(({ name }) => {
                const payment = m.payments.find(p => p.name === name);
                const balance = m.balances.find(b => b.name === name)?.balance ?? 0;
                if (!payment || payment.totalPaid === 0) {
                  return <span key={name} className="text-gray-400 dark:text-gray-500 whitespace-nowrap">—</span>;
                }
                return (
                  <span key={name} className="whitespace-nowrap leading-tight">
                    <span className="block tabular-nums text-gray-700 dark:text-gray-300">
                      {fmt(payment.totalPaid)}
                    </span>
                    {payment.extraPaid > 0 && (
                      <span className="block tabular-nums text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        {fmt(payment.minimumPaid)} min + {fmt(payment.extraPaid)} extra
                      </span>
                    )}
                    <span className="block tabular-nums text-[10px] text-gray-400 dark:text-gray-500">
                      bal {fmt(balance)}
                    </span>
                  </span>
                );
              })}
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {fmt(m.totalPaidThisMonth)}
              </span>
              <span className="tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmt(m.totalRemaining)}</span>
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 overflow-hidden">
                {m.paidOffThisMonth.length > 0 && (
                  <>
                    <Trophy className="h-3 w-3 shrink-0" />
                    <span className="truncate" title={`${m.paidOffThisMonth.join(', ')} paid off`}>
                      {m.paidOffThisMonth.join(', ')} paid off
                    </span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
