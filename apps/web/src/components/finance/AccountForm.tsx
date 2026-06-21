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
const MORTGAGE_TYPES: AccountType[] = ['Mortgage'];
const DEBT_TYPES: AccountType[] = ['Credit', 'Loan', 'Mortgage'];
const MINIMUM_PAYMENT_TYPES: AccountType[] = ['Credit', 'Loan'];
const LOAN_TYPES: AccountType[] = ['Loan'];

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

  // Mortgage detail fields
  const [mortgageStartDate, setMortgageStartDate] = useState(initialData?.mortgageStartDate ?? '');
  const [mortgageTermYears, setMortgageTermYears] = useState(initialData?.mortgageTermYears != null ? String(initialData.mortgageTermYears) : '');
  const [isInterestOnly, setIsInterestOnly] = useState(initialData?.isInterestOnly ?? false);

  // Debt payment fields
  const [minimumMonthlyPayment, setMinimumMonthlyPayment] = useState(initialData?.minimumMonthlyPayment != null ? String(initialData.minimumMonthlyPayment) : '');
  const [currentMonthlyPayment, setCurrentMonthlyPayment] = useState(initialData?.currentMonthlyPayment != null ? String(initialData.currentMonthlyPayment) : '');
  const [loanEndDate, setLoanEndDate] = useState(initialData?.loanEndDate ?? '');

  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showCreditLimit = CREDIT_LIMIT_TYPES.includes(type);
  const showOverdraftLimit = OVERDRAFT_TYPES.includes(type);
  const showInterestRate = INTEREST_RATE_TYPES.includes(type);
  const showPromoFields = CREDIT_TYPES.includes(type);
  const showFixedRateExpiry = FIXED_RATE_EXPIRY_TYPES.includes(type);
  const showMortgageFields = MORTGAGE_TYPES.includes(type);
  const showDebtPaymentFields = DEBT_TYPES.includes(type);
  const showMinimumPayment = MINIMUM_PAYMENT_TYPES.includes(type);
  const showLoanEndDate = LOAN_TYPES.includes(type);

  const remainingTermLabel = (() => {
    if (!mortgageStartDate || !mortgageTermYears) return null;
    const termYears = parseInt(mortgageTermYears, 10);
    if (isNaN(termYears) || termYears <= 0) return null;
    const start = new Date(mortgageStartDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + termYears);
    const now = new Date();
    if (end <= now) return 'Mortgage term has ended';
    const totalMonths = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''} remaining`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''} remaining`;
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} remaining`;
  })();

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
      mortgageStartDate: showMortgageFields && mortgageStartDate ? mortgageStartDate : undefined,
      mortgageTermYears: showMortgageFields && mortgageTermYears ? parseInt(mortgageTermYears, 10) || undefined : undefined,
      isInterestOnly: showMortgageFields ? isInterestOnly : undefined,
      minimumMonthlyPayment: showMinimumPayment ? parsedOptional(minimumMonthlyPayment) : undefined,
      currentMonthlyPayment: showDebtPaymentFields ? parsedOptional(currentMonthlyPayment) : undefined,
      loanEndDate: showLoanEndDate && loanEndDate ? loanEndDate : undefined,
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

      {/* ── Mortgage term ─────────────────────────────────────────────────── */}
      {showMortgageFields && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mortgage term</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mortgage-start-date" className={labelClass}>Start date</label>
              <input
                id="mortgage-start-date"
                type="date"
                value={mortgageStartDate}
                onChange={e => setMortgageStartDate(e.target.value)}
                className={fieldClass}
              />
              <p className={hintClass}>When the mortgage completed</p>
            </div>
            <div>
              <label htmlFor="mortgage-term-years" className={labelClass}>Original term (years)</label>
              <input
                id="mortgage-term-years"
                type="number"
                min="1"
                max="40"
                step="1"
                value={mortgageTermYears}
                onChange={e => setMortgageTermYears(e.target.value)}
                placeholder="e.g. 25"
                className={fieldClass}
              />
            </div>
          </div>

          {remainingTermLabel && (
            <p className="text-sm font-medium text-foreground">
              {remainingTermLabel}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isInterestOnly}
              onChange={e => setIsInterestOnly(e.target.checked)}
              className="rounded"
            />
            Interest-only mortgage
          </label>
        </div>
      )}

      {/* ── Debt payments ─────────────────────────────────────────────────── */}
      {showDebtPaymentFields && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Debt payments</p>

          {showMinimumPayment && (
            <div>
              <label htmlFor="minimum-monthly-payment" className={labelClass}>Minimum monthly payment (£)</label>
              <input
                id="minimum-monthly-payment"
                type="number"
                step="0.01"
                min="0"
                value={minimumMonthlyPayment}
                onChange={e => setMinimumMonthlyPayment(e.target.value)}
                placeholder="e.g. 25"
                className={fieldClass}
              />
              <p className={hintClass}>The minimum required payment set by your lender</p>
            </div>
          )}

          <div>
            <label htmlFor="current-monthly-payment" className={labelClass}>Current monthly payment (£)</label>
            <input
              id="current-monthly-payment"
              type="number"
              step="0.01"
              min="0"
              value={currentMonthlyPayment}
              onChange={e => setCurrentMonthlyPayment(e.target.value)}
              placeholder="e.g. 200"
              className={fieldClass}
            />
            <p className={hintClass}>What you actually pay each month (can exceed the minimum)</p>
          </div>

          {showLoanEndDate && (
            <div>
              <label htmlFor="loan-end-date" className={labelClass}>Loan end date</label>
              <input
                id="loan-end-date"
                type="date"
                value={loanEndDate}
                onChange={e => setLoanEndDate(e.target.value)}
                className={fieldClass}
              />
              <p className={hintClass}>When the loan is scheduled to be fully repaid</p>
            </div>
          )}
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
