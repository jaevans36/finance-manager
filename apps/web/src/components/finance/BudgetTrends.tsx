import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { budgetService } from '../../services/budget-service';
import type { BudgetTrendPoint } from '../../types/finance';
import { cn } from '../../lib/utils';

interface ChartRow {
  name: string;
  Budgeted: number;
  Spent: number;
}

function toChartRows(points: BudgetTrendPoint[]): ChartRow[] {
  return points.map(p => ({
    name: p.monthLabel,
    Budgeted: p.categories.reduce((sum, c) => sum + c.budgeted, 0),
    Spent: p.categories.reduce((sum, c) => sum + c.spent, 0),
  }));
}

const PERIODS = [3, 6] as const;
type Period = (typeof PERIODS)[number];

export function BudgetTrends() {
  const [months, setMonths] = useState<Period>(6);
  const [data, setData] = useState<BudgetTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    budgetService
      .getTrends(months)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load trends')
      )
      .finally(() => setIsLoading(false));
  }, [months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartRows = toChartRows(data);

  return (
    <div className="rounded-lg bg-card p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-foreground m-0">Budget Trends</h2>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setMonths(p)}
              className={cn(
                'px-3 py-1.5 border rounded text-sm transition-all',
                months === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-secondary'
              )}
            >
              {p}M
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Loading trends…
        </div>
      )}

      {error && !isLoading && (
        <div className="h-[300px] flex flex-col items-center justify-center gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && chartRows.length === 0 && (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          No budget data yet. Create a budget to see trends.
        </div>
      )}

      {!isLoading && !error && chartRows.length > 0 && (
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" style={{ fontSize: 12 }} />
              <YAxis
                style={{ fontSize: 12 }}
                tickFormatter={(v: number) => `£${v}`}
              />
              <Tooltip
                formatter={(value: number) => `£${value.toFixed(2)}`}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 4,
                }}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="Budgeted" fill="#22C55E" name="Budgeted" />
              <Bar dataKey="Spent" fill="#EF4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
