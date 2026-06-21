import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DebtProjectionMonth, DebtAccountSummary } from '../../types/finance';

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
  if (schedule.length === 0) return null;

  const sampled = sampleSchedule(schedule);

  // Build chart data: each row is a month with a column per debt
  const data = sampled.map(month => {
    const row: Record<string, string | number> = { month: month.label };
    for (const balance of month.balances) {
      const debt = debts.find(d => d.accountId === balance.accountId);
      row[debt?.name ?? balance.accountId] = Math.round(balance.balance);
    }
    return row;
  });

  const debtNames = debts.map(d => d.name);

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Debt burndown
      </h4>
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
          {debtNames.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {debtNames.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stackId="1"
              stroke={DEBT_COLOURS[i % DEBT_COLOURS.length]}
              fill={DEBT_COLOURS[i % DEBT_COLOURS.length]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
