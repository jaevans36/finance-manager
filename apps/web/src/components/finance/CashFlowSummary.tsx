import { useEffect, useState, type ReactNode } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Wallet } from 'lucide-react';
import { affordabilityService } from '../../services/affordability-service';
import { billService } from '../../services/bill-service';
import { budgetService } from '../../services/budget-service';
import { potService } from '../../services/pot-service';
import { savingsGoalService } from '../../services/savings-goal-service';
import { debtService } from '../../services/debt-service';
import type {
  AffordabilityData,
  Bill,
  Budget,
  DebtAccountSummary,
  SavingsGoalWithProjection,
  SpendingPotWithProgress,
} from '../../types/finance';
import { cn } from '../../lib/utils';
import { fmtGbp, monthlyEquivalent } from '../../lib/finance-format';

// Fixed identities, not an open-ended category list, so each bucket gets its own
// stable colour directly rather than a hash-assigned one from a shared palette.
const BUCKET_COLOURS = {
  bills: '#eb6834',
  debt: '#e34948',
  budgets: '#2a78d6',
  pots: '#1baf7a',
  savings: '#6366f1',
  buffer: '#eda100',
  remaining: '#94A3B8',
};

interface ItemRowProps {
  name: string;
  amount: number;
  colour?: string;
}

function ItemRow({ name, amount, colour }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {colour && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colour }} />}
        {name}
      </span>
      <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmtGbp(amount)}</span>
    </div>
  );
}

interface ItemGroupProps {
  title: string;
  emptyMessage: string;
  total: number;
  children: ReactNode;
  isEmpty: boolean;
}

function ItemGroup({ title, emptyMessage, total, children, isEmpty }: ItemGroupProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{fmtGbp(total)}/mo</span>
      </div>
      {isEmpty ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

export function CashFlowSummary() {
  const [affordability, setAffordability] = useState<AffordabilityData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [pots, setPots] = useState<SpendingPotWithProgress[]>([]);
  const [goals, setGoals] = useState<SavingsGoalWithProjection[]>([]);
  const [debts, setDebts] = useState<DebtAccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      affordabilityService.getAffordability(),
      billService.getBills().catch(() => []),
      budgetService.getCurrentBudgets().catch(() => []),
      potService.getPots(now.getMonth() + 1, now.getFullYear()).catch(() => []),
      savingsGoalService.getGoals().catch(() => []),
      debtService.getOverview().then(r => r.debts).catch(() => []),
    ])
      .then(([affordabilityData, billsData, budgetsData, potsData, goalsData, debtsData]) => {
        setAffordability(affordabilityData);
        setBills(billsData);
        setBudgets(budgetsData);
        setPots(potsData);
        setGoals(goalsData);
        setDebts(debtsData);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load cash flow summary'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading cash flow summary…</span>
      </div>
    );
  }

  if (error || !affordability) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        Failed to load cash flow summary{error ? `: ${error}` : ''}.
      </div>
    );
  }

  if (affordability.monthlyIncome <= 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <Wallet className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Set your monthly income on the Debt tab to see your full cash flow picture.
        </p>
      </div>
    );
  }

  // A bill linked to a debt account (e.g. a mortgage direct debit) represents that
  // debt's repayment, not a separate committed cost — it's itemized under "Existing
  // debt repayments" below instead, matching how the backend total is computed.
  const debtAccountIds = new Set(debts.map(d => d.accountId));
  const activeBills = bills
    .filter(b => b.isActive && !(b.accountId && debtAccountIds.has(b.accountId)))
    .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  const sortedBudgets = [...budgets].sort((a, b) => b.amount - a.amount);
  const envelopePots = pots.filter(p => p.type !== 'SinkingFund').sort((a, b) => b.budgetAmount - a.budgetAmount);
  const sinkingFundPots = pots.filter(p => p.type === 'SinkingFund').sort((a, b) => b.budgetAmount - a.budgetAmount);
  const activeGoals = goals.filter(g => g.goal.status === 'Active').sort((a, b) => b.goal.monthlyContribution - a.goal.monthlyContribution);
  const debtPaymentFor = (d: DebtAccountSummary) => d.effectiveMonthlyPayment ?? 0;
  const paidDebts = debts.filter(d => debtPaymentFor(d) > 0).sort((a, b) => debtPaymentFor(b) - debtPaymentFor(a));

  const { monthlyIncome, committedCosts, existingDebtPayments, discretionarySpend, plannedSavings, emergencyBuffer, safeSurplus } = affordability;

  // The discretionary-spend figure is either a real total of your Budgets/Pots, or —
  // when neither is set up — an estimate from your last 3 months of transactions.
  // Label it honestly so it isn't mistaken for budgets you never actually entered.
  const hasStructuredDiscretionary = sortedBudgets.length > 0 || envelopePots.length > 0;
  const discretionaryLabel = hasStructuredDiscretionary
    ? 'Budgeted categories & pots'
    : 'Everyday spending (estimated from transactions)';

  const pieData = [
    { name: 'Committed bills', value: committedCosts, fill: BUCKET_COLOURS.bills },
    { name: 'Existing debt repayments', value: existingDebtPayments, fill: BUCKET_COLOURS.debt },
    { name: discretionaryLabel, value: discretionarySpend, fill: BUCKET_COLOURS.budgets },
    { name: 'Planned savings', value: plannedSavings, fill: BUCKET_COLOURS.savings },
    { name: 'Safety buffer', value: emergencyBuffer, fill: BUCKET_COLOURS.buffer },
    { name: "What's left", value: Math.max(0, safeSurplus), fill: BUCKET_COLOURS.remaining },
  ].filter(slice => slice.value > 0);

  return (
    <div className="space-y-6">
      {/* Hero: what's left */}
      <div
        className={cn(
          'rounded-xl border p-4',
          safeSurplus > 0
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
            : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
        )}
      >
        <p
          className={cn(
            'text-xs font-medium uppercase tracking-wide',
            safeSurplus > 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
          )}
        >
          What&rsquo;s left this month
        </p>
        <p
          className={cn(
            'mt-0.5 text-3xl font-bold',
            safeSurplus > 0 ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300',
          )}
        >
          {fmtGbp(safeSurplus)}
        </p>
        <p className={cn('mt-1 text-xs', safeSurplus > 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
          After bills, existing debt repayments, everyday spending, planned savings, and a {fmtGbp(emergencyBuffer)} safety buffer.
          The Debt tab suggests putting 90% of this toward extra debt payments.
        </p>
      </div>

      {/* Waterfall + donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Breakdown</h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Monthly income</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">{fmtGbp(monthlyIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Committed bills</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">− {fmtGbp(committedCosts)}</span>
            </div>
            {existingDebtPayments > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Existing debt repayments</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">− {fmtGbp(existingDebtPayments)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{discretionaryLabel}</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">− {fmtGbp(discretionarySpend)}</span>
            </div>
            {plannedSavings > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Planned savings & upcoming costs</span>
                <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">− {fmtGbp(plannedSavings)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Safety buffer</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">− {fmtGbp(emergencyBuffer)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
              <span>What&rsquo;s left</span>
              <span className="tabular-nums">{fmtGbp(safeSurplus)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Where it goes</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={1} dataKey="value">
                  {pieData.map(slice => (
                    <Cell key={slice.name} fill={slice.fill} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(value?: number, name?: string) => [fmtGbp(value ?? 0), name ?? '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {pieData.map(slice => (
              <span key={slice.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.fill }} />
                {slice.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Itemized sections */}
      <ItemGroup
        title="Committed bills"
        total={activeBills.reduce((sum, b) => sum + monthlyEquivalent(b), 0)}
        isEmpty={activeBills.length === 0}
        emptyMessage="No active bills. Add one on the Bills tab."
      >
        {activeBills.map(bill => (
          <ItemRow key={bill.id} name={bill.name} amount={monthlyEquivalent(bill)} />
        ))}
      </ItemGroup>

      <ItemGroup
        title="Existing debt repayments"
        total={paidDebts.reduce((sum, d) => sum + debtPaymentFor(d), 0)}
        isEmpty={paidDebts.length === 0}
        emptyMessage="No debt repayments found. See the Debt tab for your full payoff plan."
      >
        {paidDebts.map(debt => (
          <ItemRow key={debt.accountId} name={debt.name} amount={debtPaymentFor(debt)} />
        ))}
      </ItemGroup>

      <ItemGroup
        title="Budgeted categories"
        total={sortedBudgets.reduce((sum, b) => sum + b.amount, 0)}
        isEmpty={sortedBudgets.length === 0}
        emptyMessage="No budgets set for this month. Add one on the Budgets tab."
      >
        {sortedBudgets.map(budget => (
          <ItemRow
            key={budget.id}
            name={budget.categoryName ?? 'Uncategorised'}
            amount={budget.amount}
            colour={budget.categoryColour ?? undefined}
          />
        ))}
      </ItemGroup>

      <ItemGroup
        title="Spending pots"
        total={envelopePots.reduce((sum, p) => sum + p.budgetAmount, 0) + sinkingFundPots.reduce((sum, p) => sum + p.budgetAmount, 0)}
        isEmpty={envelopePots.length === 0 && sinkingFundPots.length === 0}
        emptyMessage="No spending pots set up. Add one on the Spending Pots tab."
      >
        {envelopePots.map(pot => (
          <ItemRow key={pot.id} name={pot.name} amount={pot.budgetAmount} colour={pot.colour ?? undefined} />
        ))}
        {sinkingFundPots.length > 0 && (
          <>
            <p className="pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sinking funds</p>
            {sinkingFundPots.map(pot => (
              <ItemRow key={pot.id} name={pot.name} amount={pot.budgetAmount} colour={pot.colour ?? undefined} />
            ))}
          </>
        )}
      </ItemGroup>

      <ItemGroup
        title="Savings goals"
        total={activeGoals.reduce((sum, g) => sum + g.goal.monthlyContribution, 0)}
        isEmpty={activeGoals.length === 0}
        emptyMessage="No active savings goals. Add one on the Savings Goals tab."
      >
        {activeGoals.map(g => (
          <ItemRow key={g.goal.id} name={g.goal.name} amount={g.goal.monthlyContribution} />
        ))}
      </ItemGroup>

      <p className="text-xs text-muted-foreground">
        Budgets and Spending Pots are tracked separately — if you&rsquo;ve set up the same category in both, this summary shows both without de-duplicating.
      </p>
    </div>
  );
}
