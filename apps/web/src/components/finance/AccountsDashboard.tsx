import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, CreditCard, PiggyBank, Plus } from 'lucide-react';
import { accountsService } from '../../services/accounts-service';
import type { AccountSummary, AccountType } from '../../types/finance';
import { cn } from '../../lib/utils';

const ACCOUNT_TYPE_ICONS: Partial<Record<AccountType, React.ElementType>> = {
  Checking: Wallet,
  Savings: PiggyBank,
  Credit: CreditCard,
  Investment: TrendingUp,
  StocksIsa: TrendingUp,
  CashIsa: PiggyBank,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Checking: 'Current account',
  Savings: 'Savings',
  Credit: 'Credit card',
  CashIsa: 'Cash ISA',
  StocksIsa: 'Stocks & Shares ISA',
  Sipp: 'SIPP',
  PremiumBonds: 'Premium Bonds',
  LifetimeIsa: 'Lifetime ISA',
  Investment: 'Investment',
  Mortgage: 'Mortgage',
  Loan: 'Loan',
  Other: 'Other',
};

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

interface AccountsDashboardProps {
  onAccountSelect?: (account: AccountSummary) => void;
  onAddAccount?: () => void;
}

export function AccountsDashboard({ onAccountSelect, onAddAccount }: AccountsDashboardProps) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [accs, nw] = await Promise.all([
          accountsService.getAccounts(),
          accountsService.getNetWorth(),
        ]);
        setAccounts(accs);
        setNetWorth(nw.netWorth);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Net worth summary card */}
      {netWorth !== null && (
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white">
          <p className="text-sm opacity-80">Net worth</p>
          <p className="text-3xl font-bold mt-1">{formatBalance(netWorth, 'GBP')}</p>
          <p className="text-xs opacity-60 mt-1">{accounts.length} active accounts</p>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? Wallet;
          return (
            <button
              key={account.id}
              onClick={() => onAccountSelect?.(account)}
              className="w-full flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: account.colour ?? '#3B82F6' + '20' }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: account.colour ?? '#3B82F6' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{account.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                  {account.institution && ` · ${account.institution}`}
                </p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums flex-shrink-0',
                  account.balance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-gray-100'
                )}
              >
                {formatBalance(account.balance, account.currency)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add account button */}
      <button
        onClick={onAddAccount}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add account
      </button>
    </div>
  );
}
