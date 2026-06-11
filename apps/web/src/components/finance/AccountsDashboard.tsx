import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, CreditCard, PiggyBank, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
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

function formatRate(rate: number): string {
  return `${rate.toFixed(rate % 1 === 0 ? 0 : 1)}%`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

function formatExpiryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CreditDetail({ account }: { account: AccountSummary }) {
  if (account.type !== 'Credit' && account.type !== 'Checking' && account.type !== 'Mortgage' && account.type !== 'Loan') {
    return null;
  }
  if (!account.creditLimit && !account.interestRate && !account.promotionalBalance && !account.promotionalExpiry) {
    return null;
  }

  const owed = Math.abs(account.balance);
  const available = account.creditLimit != null ? account.creditLimit - owed : null;
  const promoBalance = account.promotionalBalance ?? 0;
  const standardBalance = Math.max(0, owed - promoBalance);
  const expiryDays = account.promotionalExpiry ? daysUntil(account.promotionalExpiry) : null;
  const expiryWarning = expiryDays != null && expiryDays <= 90;
  const expiryExpired = expiryDays != null && expiryDays < 0;

  return (
    <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 dark:border-gray-700/60 pt-2 mt-0.5">

      {/* Promotional balance row */}
      {promoBalance > 0 && account.promotionalExpiry && (
        <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          {expiryWarning && !expiryExpired && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <span>
            {formatBalance(promoBalance, account.currency)} at {formatRate(account.promotionalRate ?? 0)}
            {' '}until{' '}
            <span className={cn(expiryWarning && !expiryExpired && 'text-amber-600 dark:text-amber-400 font-medium')}>
              {formatExpiryDate(account.promotionalExpiry)}
            </span>
            {expiryWarning && !expiryExpired && (
              <span className="text-amber-600 dark:text-amber-400">
                {' '}({expiryDays === 0 ? 'expires today' : `${expiryDays}d remaining`})
              </span>
            )}
            {expiryExpired && <span className="text-red-500"> (expired)</span>}
            {account.promotionalRevertRate != null && (
              <span className="text-gray-400"> → reverts to {formatRate(account.promotionalRevertRate)}</span>
            )}
          </span>
        </div>
      )}

      {/* Standard/purchase balance row */}
      {standardBalance > 0 && account.interestRate != null && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatBalance(standardBalance, account.currency)} at {formatRate(account.interestRate)} APR
        </p>
      )}

      {/* Interest rate only (no balance breakdown) — loans, mortgages */}
      {promoBalance === 0 && account.interestRate != null && account.type !== 'Credit' && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {account.type === 'Mortgage' ? 'Fixed rate' : 'Interest rate'}: {formatRate(account.interestRate)}
          {account.promotionalExpiry && (
            <>
              {' '}· expires{' '}
              <span className={cn(expiryWarning && !expiryExpired && 'text-amber-600 dark:text-amber-400 font-medium')}>
                {formatExpiryDate(account.promotionalExpiry)}
              </span>
              {expiryWarning && !expiryExpired && (
                <span className="text-amber-600 dark:text-amber-400"> ({expiryDays}d)</span>
              )}
            </>
          )}
        </p>
      )}

      {/* Available credit */}
      {available != null && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className={cn('font-medium', available <= 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400')}>
            {formatBalance(Math.max(0, available), account.currency)} available
          </span>
          {' '}of {formatBalance(account.creditLimit!, account.currency)} limit
        </p>
      )}
    </div>
  );
}

interface AccountsDashboardProps {
  onAccountSelect?: (account: AccountSummary) => void;
  onAddAccount?: () => void;
  onEdit?: (account: AccountSummary) => void;
}

export function AccountsDashboard({ onAccountSelect, onAddAccount, onEdit }: AccountsDashboardProps) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await accountsService.deleteAccount(id);
      setConfirmDeleteId(null);
      setAccounts(prev => prev.filter(a => a.id !== id));
      const nw = await accountsService.getNetWorth();
      setNetWorth(nw.netWorth);
    } catch {
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Count how many accounts have expiring deals within 90 days
  const expiringCount = accounts.filter(a =>
    a.promotionalExpiry && daysUntil(a.promotionalExpiry) >= 0 && daysUntil(a.promotionalExpiry) <= 90
  ).length;

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

      {/* Expiry warning banner */}
      {expiringCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {expiringCount === 1
              ? '1 promotional deal expires within 90 days'
              : `${expiringCount} promotional deals expire within 90 days`}
          </span>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? Wallet;
          const isConfirmingDelete = confirmDeleteId === account.id;

          return (
            <div
              key={account.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              {/* Main row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onAccountSelect?.(account)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: (account.colour ?? '#3B82F6') + '20' }}
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
                      'text-sm font-semibold tabular-nums flex-shrink-0 mr-2',
                      account.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {formatBalance(account.balance, account.currency)}
                  </span>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setConfirmDeleteId(null); onEdit?.(account); }}
                    title="Edit account"
                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setDeleteError(null); setConfirmDeleteId(isConfirmingDelete ? null : account.id); }}
                    title="Delete account"
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Credit detail breakdown */}
              <CreditDetail account={account} />

              {/* Inline delete confirmation */}
              {isConfirmingDelete && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                    Delete <strong>{account.name}</strong>? This cannot be undone.
                  </p>
                  {deleteError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mb-2">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={isDeleting}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                      className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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
