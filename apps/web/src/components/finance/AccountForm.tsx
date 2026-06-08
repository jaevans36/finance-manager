import { useState } from 'react';
import { accountsService } from '../../services/accounts-service';
import type { AccountType, CreateAccountRequest } from '../../types/finance';
import { cn } from '../../lib/utils';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'Checking',     label: 'Current account' },
  { value: 'Savings',      label: 'Savings' },
  { value: 'Credit',       label: 'Credit card' },
  { value: 'CashIsa',      label: 'Cash ISA' },
  { value: 'StocksIsa',    label: 'Stocks & Shares ISA' },
  { value: 'Sipp',         label: 'SIPP' },
  { value: 'PremiumBonds', label: 'Premium Bonds' },
  { value: 'LifetimeIsa',  label: 'Lifetime ISA' },
  { value: 'Investment',   label: 'Investment account' },
  { value: 'Mortgage',     label: 'Mortgage' },
  { value: 'Loan',         label: 'Loan' },
  { value: 'Other',        label: 'Other' },
];

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Checking');
  const [institution, setInstitution] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(false);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setError(null);

    if (!name.trim()) {
      setNameError('Account name is required');
      return;
    }

    const request: CreateAccountRequest = {
      name: name.trim(),
      type,
      currency: 'GBP',
      initialBalance: parseFloat(initialBalance) || 0,
      institution: institution.trim() || undefined,
      excludeFromNetWorth,
    };

    setIsLoading(true);
    try {
      await accountsService.createAccount(request);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="account-name" className="block text-sm font-medium text-foreground mb-1">
          Account name
        </label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Lloyds Current"
          className={cn(fieldClass, nameError && 'border-destructive')}
        />
        {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
      </div>

      <div>
        <label htmlFor="account-type" className="block text-sm font-medium text-foreground mb-1">
          Account type
        </label>
        <select
          id="account-type"
          value={type}
          onChange={e => setType(e.target.value as AccountType)}
          className={fieldClass}
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="institution" className="block text-sm font-medium text-foreground mb-1">
          Institution
        </label>
        <input
          id="institution"
          type="text"
          value={institution}
          onChange={e => setInstitution(e.target.value)}
          placeholder="e.g. Lloyds Bank"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="initial-balance" className="block text-sm font-medium text-foreground mb-1">
          Current balance (£)
        </label>
        <input
          id="initial-balance"
          type="number"
          step="0.01"
          value={initialBalance}
          onChange={e => setInitialBalance(e.target.value)}
          className={fieldClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={excludeFromNetWorth}
          onChange={e => setExcludeFromNetWorth(e.target.checked)}
          className="rounded"
        />
        Exclude from net worth calculation
      </label>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : 'Save account'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
