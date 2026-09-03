import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { incomeStreamService } from '../../services/income-stream-service';
import { accountsService } from '../../services/accounts-service';
import { affordabilityService } from '../../services/affordability-service';
import type { AccountSummary, DetectedIncomeResponse, IncomeStream } from '../../types/finance';
import { cn } from '../../lib/utils';

const DEBT_TYPES = new Set(['Credit', 'Loan', 'Mortgage']);

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

interface StreamFormProps {
  accounts: AccountSummary[];
  initialName?: string;
  initialAmount?: string;
  initialAccountId?: string | null;
  onSave: (name: string, amount: number, accountId: string | null) => Promise<void>;
  onCancel: () => void;
}

function StreamForm({ accounts, initialName = '', initialAmount = '', initialAccountId = null, onSave, onCancel }: StreamFormProps) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount);
  const [accountId, setAccountId] = useState<string>(initialAccountId ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [detected, setDetected] = useState<DetectedIncomeResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setDetected(null);
      return;
    }
    setIsDetecting(true);
    setShowMatches(false);
    incomeStreamService.detectFromAccount(accountId)
      .then(setDetected)
      .catch(() => setDetected(null))
      .finally(() => setIsDetecting(false));
  }, [accountId]);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!name.trim() || isNaN(parsed) || parsed < 0) return;
    setIsSaving(true);
    try {
      await onSave(name.trim(), parsed, accountId || null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. My salary"
          autoFocus
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="£ / month"
          min="0"
          className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {accounts.length > 0 && (
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Not linked to an account</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      {isDetecting && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking recent transactions…
        </p>
      )}

      {!isDetecting && detected?.detectedMonthlyAmount != null && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0" />
              Detected ~{fmtGbp(detected.detectedMonthlyAmount)}/mo from {detected.transactionCount} transaction{detected.transactionCount === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMatches(v => !v)}
                className="underline hover:no-underline"
              >
                {showMatches ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => setAmount(detected.detectedMonthlyAmount!.toString())}
                className="rounded bg-amber-600 px-2 py-0.5 font-medium text-white hover:bg-amber-700"
              >
                Use this amount
              </button>
            </div>
          </div>
          {showMatches && (
            <ul className="mt-2 space-y-0.5 border-t border-amber-200 dark:border-amber-800 pt-2">
              {detected.matchedTransactions.map((t, i) => (
                <li key={i} className="flex justify-between gap-2 opacity-80">
                  <span className="truncate">{fmtDate(t.date)} — {t.payee ?? t.description ?? 'Transaction'}</span>
                  <span className="tabular-nums shrink-0">{fmtGbp(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim() || !amount}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface IncomeStreamsEditorProps {
  onChange?: () => void;
}

export function IncomeStreamsEditor({ onChange }: IncomeStreamsEditorProps) {
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [incomeAccountIds, setIncomeAccountIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [savingScope, setSavingScope] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [s, a, affordability] = await Promise.all([
        incomeStreamService.getStreams(),
        accountsService.getAccounts(),
        affordabilityService.getAffordability(),
      ]);
      setStreams(s);
      setAccounts(a.filter(acc => !DEBT_TYPES.has(acc.type)));
      setIncomeAccountIds(affordability.incomeAccountIds);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleIncomeAccount = async (accountId: string) => {
    const next = incomeAccountIds.includes(accountId)
      ? incomeAccountIds.filter(id => id !== accountId)
      : [...incomeAccountIds, accountId];
    setIncomeAccountIds(next);
    setSavingScope(true);
    try {
      await affordabilityService.updateIncomeAccounts(next);
      onChange?.();
    } finally {
      setSavingScope(false);
    }
  };

  const handleCreate = async (name: string, amount: number, accountId: string | null) => {
    await incomeStreamService.createStream({ name, monthlyAmount: amount, accountId });
    setAddingNew(false);
    await load();
    onChange?.();
  };

  const handleUpdate = async (id: string, name: string, amount: number, accountId: string | null) => {
    await incomeStreamService.updateStream(id, { name, monthlyAmount: amount, accountId });
    setEditingId(null);
    await load();
    onChange?.();
  };

  const handleDelete = async (id: string) => {
    await incomeStreamService.deleteStream(id);
    setConfirmingDeleteId(null);
    await load();
    onChange?.();
  };

  const total = streams.reduce((sum, s) => sum + s.monthlyAmount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading income sources…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {streams.map(stream => (
        editingId === stream.id ? (
          <StreamForm
            key={stream.id}
            accounts={accounts}
            initialName={stream.name}
            initialAmount={stream.monthlyAmount.toString()}
            initialAccountId={stream.accountId}
            onSave={(name, amount, accountId) => handleUpdate(stream.id, name, amount, accountId)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={stream.id}
            className={cn(
              'flex items-center justify-between rounded-lg border p-2.5',
              confirmingDeleteId === stream.id
                ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{stream.name}</p>
              {stream.accountName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Linked to {stream.accountName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {fmtGbp(stream.monthlyAmount)}
              </span>
              {confirmingDeleteId === stream.id ? (
                <>
                  <button
                    onClick={() => handleDelete(stream.id)}
                    className="text-xs font-medium px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingId(stream.id)}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Edit income source"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(stream.id)}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="Delete income source"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        )
      ))}

      {addingNew ? (
        <StreamForm
          accounts={accounts}
          onSave={handleCreate}
          onCancel={() => setAddingNew(false)}
        />
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          + Add income stream
        </button>
      )}

      {streams.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Total</span>
          <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{fmtGbp(total)}/mo</span>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Accounts to scan for detected income
          </p>
          {incomeAccountIds.length === 0 ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Currently scanning <strong>all</strong> accounts — a partner&rsquo;s or shared account&rsquo;s deposits
                will be counted as your income too. Select specific accounts below to limit detection.
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Only credits on the selected accounts count toward detected income.
            </p>
          )}
          <div className="mt-2 space-y-1">
            {accounts.map(a => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incomeAccountIds.includes(a.id)}
                  onChange={() => toggleIncomeAccount(a.id)}
                  disabled={savingScope}
                  className="rounded"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
