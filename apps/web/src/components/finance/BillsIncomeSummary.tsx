import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { affordabilityService } from '../../services/affordability-service';
import type { AffordabilityData, Bill } from '../../types/finance';
import { cn } from '../../lib/utils';
import { fmtGbp, monthlyEquivalent } from '../../lib/finance-format';

// Fixed, CVD-safe categorical palette (validated: adjacent + normal-vision ΔE both
// clear target on light and dark surfaces) — see .agents/skills dataviz reference.
// Assignment is by category name (stable hash), never by spend rank, so a category's
// colour never changes when other categories enter/leave the list.
const CATEGORY_HUES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const REMAINING_COLOUR = '#94A3B8'; // neutral slate — not part of the categorical set; this slice isn't a "series"
const PLANNED_SAVINGS_COLOUR = '#6366f1'; // fixed indigo, outside the 8-hue categorical set — not a bill category

function hueForCategory(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_HUES[hash % CATEGORY_HUES.length];
}

interface BillsIncomeSummaryProps {
  bills: Bill[];
}

export function BillsIncomeSummary({ bills }: BillsIncomeSummaryProps) {
  const [affordability, setAffordability] = useState<AffordabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    affordabilityService.getAffordability()
      .then(setAffordability)
      .catch(() => setAffordability(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading pay vs bills…</span>
      </div>
    );
  }

  const income = affordability?.monthlyIncome ?? 0;
  const plannedSavings = affordability?.plannedSavings ?? 0;

  const categoryTotals = new Map<string, number>();
  for (const bill of bills.filter(b => b.isActive)) {
    const key = bill.categoryName ?? 'Uncategorised';
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + monthlyEquivalent(bill));
  }
  const totalBills = [...categoryTotals.values()].reduce((sum, v) => sum + v, 0);
  const remaining = income - totalBills - plannedSavings;

  const categorySlices = [...categoryTotals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100, fill: hueForCategory(name) }));

  if (income <= 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Set your monthly income on the Debt tab to see how your bills compare to your pay.
        </p>
      </div>
    );
  }

  const plannedSavingsSlice = plannedSavings > 0
    ? [{ name: 'Planned savings', value: Math.round(plannedSavings * 100) / 100, fill: PLANNED_SAVINGS_COLOUR }]
    : [];
  const pieData = remaining >= 0
    ? [...categorySlices, ...plannedSavingsSlice, { name: 'Remaining', value: Math.round(remaining * 100) / 100, fill: REMAINING_COLOUR }]
    : [...categorySlices, ...plannedSavingsSlice];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Pay vs bills</h3>

      {remaining < 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
          <p className="text-xs text-red-700 dark:text-red-400">
            Your bills{plannedSavings > 0 ? ' and planned savings' : ''} come to {fmtGbp(totalBills + plannedSavings)}/mo — {fmtGbp(Math.abs(remaining))} more than your {fmtGbp(income)}/mo income.
            The chart below shows how that total splits by category.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={1}
                dataKey="value"
              >
                {pieData.map(slice => (
                  <Cell key={slice.name} fill={slice.fill} stroke="var(--card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value?: number, name?: string) => [fmtGbp(value ?? 0), name ?? '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly income</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmtGbp(income)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total bills</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmtGbp(totalBills)}</span>
          </div>
          {plannedSavings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Planned savings & upcoming costs</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{fmtGbp(plannedSavings)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Remaining{plannedSavings > 0 ? '' : ' after bills'}</span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'
              )}
            >
              {remaining < 0 ? `−${fmtGbp(Math.abs(remaining))}` : fmtGbp(remaining)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {categorySlices.map(slice => (
              <span key={slice.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.fill }} />
                {slice.name}
              </span>
            ))}
            {plannedSavings > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PLANNED_SAVINGS_COLOUR }} />
                Planned savings
              </span>
            )}
            {remaining >= 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: REMAINING_COLOUR }} />
                Remaining
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
