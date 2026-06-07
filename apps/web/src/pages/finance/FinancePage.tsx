import { useEffect, useState } from 'react';
import { PiggyBank, Plus, X } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import { financeCategoryService } from '../../services/finance-category-service';
import type { Category } from '../../types/finance';

import { BudgetDashboard } from '../../components/finance/BudgetDashboard';
import { BudgetForm } from '../../components/finance/BudgetForm';
import { BudgetTrends } from '../../components/finance/BudgetTrends';
import { SpendingPots } from '../../components/finance/SpendingPots';
import { BillsDashboard } from '../../components/finance/BillsDashboard';
import { BillForm } from '../../components/finance/BillForm';
import { RecurringDetected } from '../../components/finance/RecurringDetected';
import { SavingsGoalsDashboard } from '../../components/finance/SavingsGoalsDashboard';
import { SavingsGoalForm } from '../../components/finance/SavingsGoalForm';

type Tab = 'budgets' | 'pots' | 'bills' | 'goals' | 'trends';

const TABS: { id: Tab; label: string }[] = [
  { id: 'budgets', label: 'Budgets' },
  { id: 'pots',    label: 'Spending Pots' },
  { id: 'bills',   label: 'Bills' },
  { id: 'goals',   label: 'Savings Goals' },
  { id: 'trends',  label: 'Trends' },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('budgets');
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  // Key incremented to force dashboard re-fetch after a new item is saved
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    financeCategoryService.getCategories()
      .then(setCategories)
      .catch(() => { /* categories are best-effort; budgets still work without them */ });
  }, []);

  const handleSaved = () => {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setShowForm(false);
  };

  const canAddOnTab = activeTab !== 'trends';

  return (
    <PageLayout
      title="Finance"
      subtitle="Budgets, bills, spending pots, and savings goals"
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

      {/* Add button + inline form panel */}
      {canAddOnTab && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus size={16} />
              {activeTab === 'budgets' && 'Add budget'}
              {activeTab === 'pots'    && 'Add spending pot'}
              {activeTab === 'bills'   && 'Add bill'}
              {activeTab === 'goals'   && 'Add goal'}
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">
                  {activeTab === 'budgets' && 'New budget'}
                  {activeTab === 'pots'    && 'New spending pot'}
                  {activeTab === 'bills'   && 'New bill'}
                  {activeTab === 'goals'   && 'New savings goal'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {activeTab === 'budgets' && (
                <BudgetForm
                  categories={categories}
                  onSuccess={handleSaved}
                  onCancel={() => setShowForm(false)}
                />
              )}
              {activeTab === 'pots' && (
                <p className="text-sm text-muted-foreground">
                  Spending pot creation coming soon — use the Finance API Swagger at{' '}
                  <a href="http://localhost:5002/swagger" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    localhost:5002/swagger
                  </a>{' '}
                  in the meantime.
                </p>
              )}
              {activeTab === 'bills' && (
                <BillForm onSuccess={handleSaved} />
              )}
              {activeTab === 'goals' && (
                <SavingsGoalForm onSuccess={handleSaved} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'budgets' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">This month</h2>
            <BudgetDashboard key={refreshKey} />
          </div>
        </section>
      )}

      {activeTab === 'pots' && (
        <section>
          <SpendingPots key={refreshKey} onAddPot={() => setShowForm(true)} />
        </section>
      )}

      {activeTab === 'bills' && (
        <section className="space-y-8">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Upcoming bills</h2>
            <BillsDashboard key={refreshKey} onAddBill={() => setShowForm(true)} />
          </div>
          <div>
            <RecurringDetected />
          </div>
        </section>
      )}

      {activeTab === 'goals' && (
        <section>
          <SavingsGoalsDashboard key={refreshKey} onAddGoal={() => setShowForm(true)} />
        </section>
      )}

      {activeTab === 'trends' && (
        <section>
          <BudgetTrends />
        </section>
      )}
    </PageLayout>
  );
}
