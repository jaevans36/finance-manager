import { useState } from 'react';
import { accountsService } from '../../services/accounts-service';
import type { AccountSummary, AccountType, CreateAccountRequest, UpdateAccountRequest } from '../../types/finance';
import { cn } from '../../lib/utils';
import { getErrorMessage } from '../../utils/errorHelpers';

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

const CREDIT_TYPES: AccountType[] = ['Credit'];
const INTEREST_RATE_TYPES: AccountType[] = ['Credit', 'Loan', 'Mortgage', 'Checking'];
const OVERDRAFT_TYPES: AccountType[] = ['Checking'];
const CREDIT_LIMIT_TYPES: AccountType[] = ['Credit'];
const FIXED_RATE_EXPIRY_TYPES: AccountType[] = ['Mortgage'];

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  accountId?: string;
  initialData?: AccountSummary;
}

export function AccountForm({ onSuccess, onCancel, accountId, initialData }: AccountFormProps) {
  const isEdit = !!accountId;

  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<AccountType>(initialData?.type ?? 'Checking');
  const [institution, setInstitution] = useState(initialData?.institution ?? '');
  const [balance, setBalance] = useState(String(initialData?.balance ?? '0'));
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(initialData?.excludeFromNetWorth ?? false);

  // Credit detail fields
  const [creditLimit, setCreditLimit] = useState(initialData?.creditLimit != null ? String(initialData.creditLimit) : '');
  const [interestRate, setInterestRate] = useState(initialData?.interestRate != null ? String(initialData.interestRate) : '');
  const [promotionalBalance, setPromotionalBalance] = useState(initialData?.promotionalBalance != null ? String(initialData.promotionalBalance) : '');
  const [promotionalRate, setPromotionalRate] = useState(initialData?.promotionalRate != null ? String(initialData.promotionalRate) : '');
  const [promotionalExpiry, setPromotionalExpiry] = useState(initialData?.promotionalExpiry ?? '');
  const [promotionalRevertRate, setPromotionalRevertRate] = useState(initialData?.promotionalRevertRate != null ? String(initialData.promotionalRevertRate) : '');

  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showCreditLimit = CREDIT_LIMIT_TYPES.includes(type);
  const showOverdraftLimit = OVERDRAFT_TYPES.includes(type);
  const showInterestRate = INTEREST_RATE_TYPES.includes(type);
  const showPromoFields = CREDIT_TYPES.includes(type);
  const showFixedRateExpiry = FIXED_RATE_EXPIRY_TYPES.includes(type);

  const parsedOptional = (val: string) => val.trim() === '' ? undefined : parseFloat(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setError(null);

    if (!name.trim()) {
      setNameError('Account name is required');
      return;
    }

    const creditDetail = {
      creditLimit: showCreditLimit || showOverdraftLimit ? parsedOptional(creditLimit) : undefined,
      interestRate: showInterestRate ? parsedOptional(interestRate) : undefined,
      promotionalBalance: showPromoFields ? parsedOptional(promotionalBalance) : undefined,
      promotionalRate: showPromoFields ? parsedOptional(promotionalRate) : undefined,
      promotionalExpiry: (showPromoFields || showFixedRateExpiry) && promotionalExpiry ? promotionalExpiry : undefined,
      promotionalRevertRate: showPromoFields ? parsedOptional(promotionalRevertRate) : undefined,
    };

    setIsLoading(true);
    try {
      if (isEdit) {
        const request: UpdateAccountRequest = {
          name: name.trim(),
          type,
          balance: parseFloat(balance) || 0,
          institution: institution.trim() || undefined,
          excludeFromNetWorth,
          ...creditDetail,
        };
        await accountsService.updateAccount(accountId, request);
      } else {
        const request: CreateAccountRequest = {
          name: name.trim(),
          type,
          currency: 'GBP',
          initialBalance: parseFloat(balance) || 0,
          institution: institution.trim() || undefined,
          excludeFromNetWorth,
          ...creditDetail,
        };
        await accountsService.createAccount(request);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save account. Please check your details and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';
  const hintClass = 'mt-0.5 text-xs text-muted-foreground';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Core fields ───────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="account-name" className={labelClass}>Account name</label>
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
        <label htmlFor="account-type" className={labelClass}>Account type</label>
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
        <label htmlFor="institution" className={labelClass}>Institution</label>
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
        <label htmlFor="balance" className={labelClass}>Current balance (£)</label>
        <input
          id="balance"
          type="number"
          step="0.01"
          value={balance}
          onChange={e => setBalance(e.target.value)}
          className={fieldClass}
        />
        {(type === 'Credit' || type === 'Loan' || type === 'Mortgage') && (
          <p className={hintClass}>Enter as a negative number if money is owed (e.g. −1200)</p>
        )}
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

      {/* ── Credit limit ──────────────────────────────────────────────────── */}
      {(showCreditLimit || showOverdraftLimit) && (
        <div>
          <label htmlFor="credit-limit" className={labelClass}>
            {showOverdraftLimit ? 'Overdraft limit (£)' : 'Credit limit (£)'}
          </label>
          <input
            id="credit-limit"
            type="number"
            step="0.01"
            min="0"
            value={creditLimit}
            onChange={e => setCreditLimit(e.target.value)}
            placeholder="e.g. 4000"
            className={fieldClass}
          />
        </div>
      )}

      {/* ── Interest rate ─────────────────────────────────────────────────── */}
      {showInterestRate && (
        <div>
          <label htmlFor="interest-rate" className={labelClass}>
            {type === 'Credit' ? 'Purchase rate (APR %)' : type === 'Checking' ? 'Overdraft rate (APR %)' : 'Interest rate (%)'}
          </label>
          <input
            id="interest-rate"
            type="number"
            step="0.001"
            min="0"
            value={interestRate}
            onChange={e => setInterestRate(e.target.value)}
            placeholder="e.g. 24.9"
            className={fieldClass}
          />
        </div>
      )}

      {/* ── Promotional deal (credit cards) ───────────────────────────────── */}
      {showPromoFields && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Promotional deal</p>

          <div>
            <label htmlFor="promo-balance" className={labelClass}>Balance on promotional rate (£)</label>
            <input
              id="promo-balance"
              type="number"
              step="0.01"
              min="0"
              value={promotionalBalance}
              onChange={e => setPromotionalBalance(e.target.value)}
              placeholder="e.g. 2000"
              className={fieldClass}
            />
            <p className={hintClass}>Amount currently on a 0% or reduced-rate deal</p>
          </div>

          <div>
            <label htmlFor="promo-rate" className={labelClass}>Promotional rate (%)</label>
            <input
              id="promo-rate"
              type="number"
              step="0.001"
              min="0"
              value={promotionalRate}
              onChange={e => setPromotionalRate(e.target.value)}
              placeholder="0 for 0% deals"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="promo-expiry" className={labelClass}>Deal expiry date</label>
            <input
              id="promo-expiry"
              type="date"
              value={promotionalExpiry}
              onChange={e => setPromotionalExpiry(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="promo-revert-rate" className={labelClass}>Rate after deal ends (%)</label>
            <input
              id="promo-revert-rate"
              type="number"
              step="0.001"
              min="0"
              value={promotionalRevertRate}
              onChange={e => setPromotionalRevertRate(e.target.value)}
              placeholder="e.g. 24.9"
              className={fieldClass}
            />
            <p className={hintClass}>Usually the same as the purchase rate</p>
          </div>
        </div>
      )}

      {/* ── Fixed rate expiry (mortgages) ──────────────────────────────────── */}
      {showFixedRateExpiry && (
        <div>
          <label htmlFor="fixed-rate-expiry" className={labelClass}>Fixed rate expiry date</label>
          <input
            id="fixed-rate-expiry"
            type="date"
            value={promotionalExpiry}
            onChange={e => setPromotionalExpiry(e.target.value)}
            className={fieldClass}
          />
          <p className={hintClass}>When your current fixed-rate deal ends</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Save account'}
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
