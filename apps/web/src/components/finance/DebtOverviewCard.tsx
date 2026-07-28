import { AlertTriangle, TrendingDown, CheckCircle, Info } from 'lucide-react';
import type { DebtAccountSummary, DebtSeverityLabel } from '../../types/finance';
import { cn } from '../../lib/utils';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPayoffDate(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function SeverityBadge({ label }: { label: DebtSeverityLabel }) {
  const variants: Record<DebtSeverityLabel, string> = {
    Low: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', variants[label])}>
      {label}
    </span>
  );
}

function SeverityIcon({ label }: { label: DebtSeverityLabel }) {
  if (label === 'Critical' || label === 'High') {
    return <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />;
  }
  if (label === 'Medium') {
    return <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />;
  }
  return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />;
}

function UtilisationBar({ balance, creditLimit }: { balance: number; creditLimit: number }) {
  const used = Math.abs(balance);
  const pct = Math.min(100, Math.round((used / creditLimit) * 100));
  const barColour =
    pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-orange-400' : pct >= 50 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Utilisation</span>
        <span className="font-medium">{pct}% of {fmt(creditLimit)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColour)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface DebtOverviewCardProps {
  debts: DebtAccountSummary[];
  totalDebt: number;
  totalMinimumPayments: number;
  totalCurrentPayments: number;
}

export function DebtOverviewCard({
  debts,
  totalDebt,
  totalMinimumPayments,
  totalCurrentPayments,
}: DebtOverviewCardProps) {
  if (debts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900 dark:text-gray-100">Debt-free!</p>
        <p className="text-sm text-gray-500 mt-1">No active credit card, loan, or mortgage balances.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header totals */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Debt overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total owed</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {fmt(totalDebt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Minimum payments</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
              {fmt(totalMinimumPayments)}<span className="text-sm font-normal">/mo</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current payments</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
              {fmt(totalCurrentPayments)}<span className="text-sm font-normal">/mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Debt list */}
      <ul className="divide-y divide-border">
        {debts.map(debt => (
          <li key={debt.accountId} className="p-4">
            {/* Name + balance + severity */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <SeverityIcon label={debt.severityLabel} />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {debt.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {debt.type}
                    {debt.interestRate != null && ` · ${debt.interestRate}% APR`}
                  </p>
                  {debt.severityReason && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {debt.severityReason}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                  {fmt(Math.abs(debt.balance))}
                </p>
                <div className="mt-1">
                  <SeverityBadge label={debt.severityLabel} />
                </div>
              </div>
            </div>

            {/* Utilisation bar — credit cards with a credit limit */}
            {debt.type === 'Credit' && debt.creditLimit != null && debt.creditLimit > 0 && (
              <UtilisationBar balance={debt.balance} creditLimit={debt.creditLimit} />
            )}

            {/* Payment stats */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {debt.minimumMonthlyPayment != null && (
                <span>Min: {fmt(debt.minimumMonthlyPayment)}/mo</span>
              )}
              {debt.currentMonthlyPayment != null && (
                <span>Paying: {fmt(debt.currentMonthlyPayment)}/mo</span>
              )}
              {debt.promotionalExpiry && (
                <span className="text-amber-600 dark:text-amber-400">
                  Promo ends {debt.promotionalExpiry}
                </span>
              )}
            </div>

            {/* Interest, actual payments, and payoff estimate */}
            {(debt.monthlyInterestCost != null || debt.detectedMonthlyPayment != null || debt.payoffDateAtCurrentPayment != null) && (
              <div className="mt-1.5 space-y-0.5 text-xs">
                {/* Interest cost line */}
                {debt.monthlyInterestCost != null && (
                  <div className="flex flex-wrap gap-x-4">
                    <span className="text-red-600 dark:text-red-400">
                      {fmt(debt.monthlyInterestCost)}/mo interest
                      {debt.promotionalBalance != null && debt.promotionalBalance > 0 && debt.interestRate != null && (
                        <span className="text-gray-400 dark:text-gray-500 ml-1">
                          ({fmt(Math.abs(debt.balance) - debt.promotionalBalance)} at {debt.interestRate}%
                          {debt.promotionalRate != null
                            ? ` · ${fmt(debt.promotionalBalance)} at ${debt.promotionalRate}%`
                            : ''})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Actual payment from transactions */}
                {debt.detectedMonthlyPayment != null && (() => {
                  const toBalance = debt.monthlyInterestCost != null
                    ? debt.detectedMonthlyPayment - debt.monthlyInterestCost
                    : debt.detectedMonthlyPayment;
                  return (
                    <div className="flex flex-wrap gap-x-2 items-center text-gray-500 dark:text-gray-400">
                      <span>{fmt(debt.detectedMonthlyPayment)}/mo actual payments</span>
                      {debt.monthlyInterestCost != null && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">→</span>
                          <span className={toBalance > 0
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                          }>
                            {toBalance > 0 ? fmt(toBalance) : `−${fmt(Math.abs(toBalance))}`} to balance
                          </span>
                        </>
                      )}
                      <span className="text-gray-400 dark:text-gray-500">(3 mo avg)</span>
                    </div>
                  );
                })()}

                {/* Payoff estimate */}
                {debt.payoffDateAtCurrentPayment != null ? (
                  <div>
                    <span className="text-green-700 dark:text-green-400">
                      Pay off: {formatPayoffDate(debt.payoffDateAtCurrentPayment)} at current rate
                    </span>
                  </div>
                ) : (
                  debt.currentMonthlyPayment != null && debt.interestRate != null && (
                    <div>
                      <span className="text-amber-600 dark:text-amber-400">
                        Payment doesn't cover interest — balance is growing
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
