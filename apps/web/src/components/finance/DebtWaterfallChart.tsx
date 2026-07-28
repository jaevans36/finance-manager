import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DebtProjectionMonth, DebtAccountSummary } from '../../types/finance';
import { cn } from '../../lib/utils';

// Sample the schedule to at most maxPoints data points for performance
function sampleSchedule(schedule: DebtProjectionMonth[], maxPoints = 48): DebtProjectionMonth[] {
  if (schedule.length <= maxPoints) return schedule;
  const step = Math.ceil(schedule.length / maxPoints);
  const sampled = schedule.filter((_, i) => i % step === 0);
  const last = schedule[schedule.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

const DEBT_COLOURS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#3b82f6', '#a3e635',
];

interface DebtWaterfallChartProps {
  schedule: DebtProjectionMonth[];
  debts: DebtAccountSummary[];
}

export function DebtWaterfallChart({ schedule, debts }: DebtWaterfallChartProps) {
  const [hiddenDebts, setHiddenDebts] = useState<Set<string>>(new Set());
  const [viewYears, setViewYears] = useState<number | null>(null);

  if (schedule.length === 0) return null;

  const totalYears = Math.ceil(schedule.length / 12);

  // Build range options — shorter ranges only shown when they're a meaningful subset of total
  const rangeOptions: { label: string; years: number | null }[] = [
    ...[2, 5, 10, 20].filter(y => y < totalYears).map(y => ({ label: `${y} yr`, years: y })),
    { label: 'All', years: null },
  ];

  const filtered = viewYears ? schedule.filter(m => m.month <= viewYears * 12) : schedule;
  const sampled = sampleSchedule(filtered);

  // Build chart data: each row is a month with a column per debt
  const data = sampled.map(month => {
    const row: Record<string, string | number> = { month: month.label };
    for (const balance of month.balances) {
      const debt = debts.find(d => d.accountId === balance.accountId);
      row[debt?.name ?? balance.accountId] = Math.round(balance.balance);
    }
    return row;
  });

  // Preserve original index so colours stay consistent when toggling
  const debtEntries = debts.map((d, i) => ({ name: d.name, colour: DEBT_COLOURS[i % DEBT_COLOURS.length] }));
  const visibleEntries = debtEntries.filter(e => !hiddenDebts.has(e.name));

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const toggleDebt = (name: string) => {
    setHiddenDebts(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Debt burndown
        </h4>

        {/* Year range selector — only shown when the projection spans more than 2 years */}
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

      {/* Debt filter chips — only shown when there are multiple debts */}
      {debtEntries.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {debtEntries.map(({ name, colour }) => {
            const hidden = hiddenDebts.has(name);
            return (
              <button
                key={name}
                onClick={() => toggleDebt(name)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity',
                  hidden ? 'opacity-35' : 'opacity-100',
                )}
                style={{ borderColor: colour, color: hidden ? undefined : colour }}
                title={hidden ? `Show ${name}` : `Hide ${name}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colour }} />
                {name}
              </button>
            );
          })}
        </div>
      )}

      {visibleEntries.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Select at least one debt to display the chart.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickFormatter={v => {
                if (typeof v !== 'string') return String(v);
                const [year, month] = v.split('-');
                return `${month}/${String(year).slice(2)}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={v => fmt(v as number)}
              tick={{ fontSize: 11 }}
              width={64}
            />
            <Tooltip
              formatter={(value: number | string | undefined) =>
                typeof value === 'number' ? [fmt(value)] : [String(value ?? '')]
              }
              labelFormatter={label => `Month: ${label}`}
              contentStyle={{ fontSize: 12 }}
            />
            {visibleEntries.map(({ name, colour }) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="1"
                stroke={colour}
                fill={colour}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
