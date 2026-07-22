import { useCallback, useEffect, useState } from 'react';
import { PiggyBank, Plus, X } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import { financeCategoryService } from '../../services/finance-category-service';
import { transactionsService } from '../../services/transactions-service';
import type { TransactionFilters as TxFilters } from '../../services/transactions-service';
import type { AccountSummary, Category, PagedResult, Transaction } from '../../types/finance';

import { AccountsDashboard } from '../../components/finance/AccountsDashboard';
import { AccountForm } from '../../components/finance/AccountForm';
import { AddTransactionForm } from '../../components/finance/AddTransactionForm';
import { CsvImport } from '../../components/finance/CsvImport';
import { TransactionFilters } from '../../components/finance/TransactionFilters';
import { TransactionList } from '../../components/finance/TransactionList';
import { TransactionDetailPanel } from '../../components/finance/TransactionDetailPanel';
import { BudgetDashboard } from '../../components/finance/BudgetDashboard';
import { BudgetForm } from '../../components/finance/BudgetForm';
import { BudgetTrends } from '../../components/finance/BudgetTrends';
import { SpendingPots } from '../../components/finance/SpendingPots';
import { BillsDashboard } from '../../components/finance/BillsDashboard';
import { BillForm } from '../../components/finance/BillForm';
import { RecurringDetected } from '../../components/finance/RecurringDetected';
import { SavingsGoalsDashboard } from '../../components/finance/SavingsGoalsDashboard';
import { SavingsGoalForm } from '../../components/finance/SavingsGoalForm';
import { DebtBurndownDashboard } from '../../components/finance/DebtBurndownDashboard';
import { InsightsDashboard } from '../../components/finance/InsightsDashboard';

type Tab = 'accounts' | 'transactions' | 'budgets' | 'pots' | 'bills' | 'goals' | 'trends' | 'debt' | 'insights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'accounts',     label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets',      label: 'Budgets' },
  { id: 'pots',         label: 'Spending Pots' },
  { id: 'bills',        label: 'Bills' },
  { id: 'goals',        label: 'Savings Goals' },
  { id: 'trends',       label: 'Trends' },
  { id: 'debt',         label: 'Debt' },
  { id: 'insights',     label: 'AI Insights' },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Accounts + Transactions state
  const [selectedAccount, setSelectedAccount] = useState<AccountSummary | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(null);
  const [txFilters, setTxFilters] = useState<Partial<TxFilters>>({});
  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState<PagedResult<Transaction> | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showAddTx, setShowAddTx] = useState(false);

  useEffect(() => {
    financeCategoryService.getCategories()
      .then(setCategories)
      .catch(() => { /* categories are best-effort */ });
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!selectedAccount) return;
    setTxLoading(true);
    try {
      const data = await transactionsService.getTransactions({
        accountId: selectedAccount.id,
        ...txFilters,
        page: txPage,
        pageSize: 50,
      });
      setTxData(data);
    } catch {
      setTxData(null);
    } finally {
      setTxLoading(false);
    }
  }, [selectedAccount, txFilters, txPage]);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions();
  }, [activeTab, loadTransactions]);

  const handleFilterChange = (partial: Partial<TxFilters>) => {
    setTxFilters(prev => ({ ...prev, ...partial }));
    setTxPage(1);
  };

  const handleAccountSelect = (account: AccountSummary) => {
    setSelectedAccount(account);
    setActiveTab('transactions');
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingAccount(null);
    setRefreshKey(k => k + 1);
    if (activeTab === 'accounts') loadTransactions();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setShowImport(false);
    setShowAddTx(false);
    setEditingAccount(null);
  };

  const canAddOnTab = !['trends', 'transactions'].includes(activeTab);

  return (
    <PageLayout
      title="Finance"
      subtitle="Accounts, transactions, budgets, bills, and savings goals"
      headerActions={
        <div className="flex items-center gap-2">
          <PiggyBank size={20} className="text-muted-foreground" />
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Accounts tab ─────────────────────────────────────────────────── */}
      {activeTab === 'accounts' && (
        <section className="space-y-6">
          {editingAccount ? (
            <div className="rounded-xl border border-border bg-card p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Edit account</h3>
                <button onClick={() => setEditingAccount(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <AccountForm
                accountId={editingAccount.id}
                initialData={editingAccount}
                onSuccess={handleSaved}
                onCancel={() => setEditingAccount(null)}
              />
            </div>
          ) : showForm ? (
            <div className="rounded-xl border border-border bg-card p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Add account</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <AccountForm onSuccess={handleSaved} onCancel={() => setShowForm(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus size={16} /> Add account
            </button>
          )}
          <AccountsDashboard
            key={refreshKey}
            onAccountSelect={handleAccountSelect}
            onAddAccount={() => { setEditingAccount(null); setShowForm(true); }}
            onEdit={account => { setShowForm(false); setEditingAccount(account); }}
          />
        </section>
      )}

      {/* ── Transactions tab ──────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <section className="space-y-4">
          {selectedAccount ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{selectedAccount.name}</span>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Change account
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddTx(v => !v); setShowImport(false); }}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showAddTx ? 'Cancel' : 'Add manually'}
                  </button>
                  <button
                    onClick={() => { setShowImport(v => !v); setShowAddTx(false); }}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showImport ? 'Hide import' : 'Import CSV'}
                  </button>
                </div>
              </div>

              {showAddTx && (
                <div className="rounded-xl border border-border bg-card p-5 max-w-lg">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Add transaction manually</h3>
                  <AddTransactionForm
                    accountId={selectedAccount.id}
                    categories={categories}
                    onAdded={() => { setShowAddTx(false); loadTransactions(); }}
                    onCancel={() => setShowAddTx(false)}
                  />
                </div>
              )}

              {showImport && (
                <div className="rounded-xl border border-border bg-card p-5 max-w-lg">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Import bank statement</h3>
                  <CsvImport
                    accountId={selectedAccount.id}
                    onImportComplete={() => { setShowImport(false); loadTransactions(); }}
                  />
                </div>
              )}

              <TransactionFilters
                categories={categories}
                onFilterChange={handleFilterChange}
                currentFilters={txFilters}
              />

              <TransactionList
                data={txData}
                isLoading={txLoading}
                page={txPage}
                onPageChange={setTxPage}
                onTransactionClick={setSelectedTx}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <p className="text-sm">Select an account to view its transactions</p>
              <button
                onClick={() => setActiveTab('accounts')}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to Accounts
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Budgets tab ───────────────────────────────────────────────────── */}
      {activeTab === 'budgets' && (
        <section className="space-y-6">
          {canAddOnTab && (
            <div className="mb-2">
              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus size={16} /> Add budget
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">New budget</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                  </div>
                  <BudgetForm categories={categories} onSuccess={handleSaved} onCancel={() => setShowForm(false)} />
                </div>
              )}
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">This month</h2>
            <BudgetDashboard key={refreshKey} />
          </div>
        </section>
      )}

      {/* ── Spending Pots tab ─────────────────────────────────────────────── */}
      {activeTab === 'pots' && (
        <section>
          <SpendingPots key={refreshKey} onAddPot={() => setShowForm(true)} />
        </section>
      )}

      {/* ── Bills tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'bills' && (
        <section className="space-y-8">
          {canAddOnTab && (
            <div className="mb-2">
              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus size={16} /> Add bill
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">New bill</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                  </div>
                  <BillForm onSuccess={handleSaved} onCancel={() => setShowForm(false)} />
                </div>
              )}
            </div>
          )}

          <BillsDashboard key={refreshKey} onAddBill={() => setShowForm(true)} />

          <RecurringDetected onBillSaved={handleSaved} />
        </section>
      )}

      {/* ── Goals tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'goals' && (
        <section>
          {canAddOnTab && (
            <div className="mb-4">
              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus size={16} /> Add goal
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">New savings goal</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                  </div>
                  <SavingsGoalForm onSuccess={handleSaved} />
                </div>
              )}
            </div>
          )}
          <SavingsGoalsDashboard key={refreshKey} onAddGoal={() => setShowForm(true)} />
        </section>
      )}

      {/* ── Trends tab ────────────────────────────────────────────────────── */}
      {activeTab === 'trends' && (
        <section><BudgetTrends /></section>
      )}

      {/* ── Debt tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'debt' && (
        <section><DebtBurndownDashboard /></section>
      )}

      {/* ── AI Insights tab ───────────────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <section><InsightsDashboard /></section>
      )}

      {/* Transaction detail panel */}
      {selectedTx && (
        <TransactionDetailPanel
          transaction={selectedTx}
          categories={categories}
          onClose={() => setSelectedTx(null)}
          onUpdated={() => { setSelectedTx(null); loadTransactions(); }}
          onDeleted={() => { setSelectedTx(null); loadTransactions(); }}
        />
      )}
    </PageLayout>
  );
}
