import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { CashFlowSummary } from '../../src/components/finance/CashFlowSummary';
import type {
  AffordabilityData,
  Bill,
  Budget,
  DebtAccountSummary,
  SavingsGoalWithProjection,
  SpendingPotWithProgress,
} from '../../src/types/finance';

jest.mock('../../src/services/affordability-service', () => ({
  affordabilityService: { getAffordability: jest.fn() },
}));
jest.mock('../../src/services/bill-service', () => ({
  billService: { getBills: jest.fn() },
}));
jest.mock('../../src/services/budget-service', () => ({
  budgetService: { getCurrentBudgets: jest.fn() },
}));
jest.mock('../../src/services/pot-service', () => ({
  potService: { getPots: jest.fn() },
}));
jest.mock('../../src/services/savings-goal-service', () => ({
  savingsGoalService: { getGoals: jest.fn() },
}));
jest.mock('../../src/services/debt-service', () => ({
  debtService: { getOverview: jest.fn() },
}));

const { affordabilityService } = jest.requireMock('../../src/services/affordability-service');
const { billService } = jest.requireMock('../../src/services/bill-service');
const { budgetService } = jest.requireMock('../../src/services/budget-service');
const { potService } = jest.requireMock('../../src/services/pot-service');
const { savingsGoalService } = jest.requireMock('../../src/services/savings-goal-service');
const { debtService } = jest.requireMock('../../src/services/debt-service');

const makeAffordability = (overrides: Partial<AffordabilityData> = {}): AffordabilityData => ({
  monthlyIncome: 3000,
  incomeConfidence: 'High',
  incomeSource: 'Detected',
  committedCosts: 1000,
  existingDebtPayments: 0,
  discretionarySpend: 500,
  plannedSavings: 200,
  emergencyBuffer: 150,
  safeSurplus: 1100,
  suggestedDebtPayment: 990,
  calculatedAt: '',
  incomeAccountIds: [],
  ...overrides,
});

const makeDebt = (overrides: Partial<DebtAccountSummary> = {}): DebtAccountSummary => ({
  accountId: 'd1', name: 'Barclaycard', type: 'Credit', balance: -500, creditLimit: 1000,
  interestRate: 20, promotionalBalance: null, minimumMonthlyPayment: 50, currentMonthlyPayment: null,
  promotionalRate: null, promotionalExpiry: null, loanEndDate: null, severityScore: 50,
  severityLabel: 'Medium', severityReason: null, monthlyInterestCost: 8,
  monthsToPayoffAtCurrentPayment: 12, payoffDateAtCurrentPayment: '2027-06', detectedMonthlyPayment: null,
  effectiveMonthlyPayment: 50,
  ...overrides,
});

const makeBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: 'b1', userId: 'u1', name: 'Netflix', description: null,
  amount: 100, frequency: 'Monthly', dueDay: 1, reminderDaysBefore: 3,
  isPaid: false, lastPaidDate: null, categoryId: null, categoryName: 'Streaming & Media',
  isActive: true, createdAt: '', updatedAt: '', accountId: null, accountName: null,
  ...overrides,
});

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'bud1', categoryId: 'c1', categoryName: 'Groceries', categoryColour: '#22C55E',
  categoryIcon: 'shopping-cart', month: 6, year: 2025, amount: 400, spent: 0,
  rolloverFromPrevious: 0, percentageUsed: 0, isWarning: false, isExceeded: false,
  ...overrides,
});

const makePot = (overrides: Partial<SpendingPotWithProgress> = {}): SpendingPotWithProgress => ({
  id: 'p1', name: 'Fuel', type: 'Fuel', budgetAmount: 150, spent: 0, remaining: 150,
  rolloverEnabled: false, icon: null, colour: '#eda100', categoryIds: [],
  percentageUsed: 0, isWarning: false, isExceeded: false, annualAmount: null,
  nextPaymentDate: null, accumulatedAmount: 0, monthlyAllocation: null,
  monthsRemaining: null, isReady: false,
  ...overrides,
});

const makeGoal = (overrides: Partial<SavingsGoalWithProjection> = {}): SavingsGoalWithProjection => ({
  goal: {
    id: 'g1', userId: 'u1', name: 'Holiday', targetAmount: 2000, currentAmount: 800,
    monthlyContribution: 100, status: 'Active', targetDate: null, createdAt: '', updatedAt: '',
  },
  percentageComplete: 40, monthsToTarget: 6, projectedCompletionDate: null, isOnTrack: true,
  ...overrides,
});

describe('CashFlowSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    billService.getBills.mockResolvedValue([]);
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    potService.getPots.mockResolvedValue([]);
    savingsGoalService.getGoals.mockResolvedValue([]);
    debtService.getOverview.mockResolvedValue({ debts: [], totalDebt: 0, totalMinimumPayments: 0, totalCurrentPayments: 0 });
  });

  it('prompts to set income when none is detected', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 0 }));
    renderWithProviders(<CashFlowSummary />);
    await waitFor(() => expect(screen.getByText(/set your monthly income/i)).toBeInTheDocument());
  });

  it('shows an error message when the affordability fetch fails', async () => {
    affordabilityService.getAffordability.mockRejectedValue(new Error('network error'));
    renderWithProviders(<CashFlowSummary />);
    await waitFor(() => expect(screen.getByText(/failed to load cash flow summary/i)).toBeInTheDocument());
  });

  it('shows the hero "what\'s left" figure and waterfall breakdown', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText(/what.s left this month/i)).toBeInTheDocument());
    expect(screen.getAllByText('£1,100').length).toBeGreaterThan(0); // safeSurplus, hero + waterfall total
    expect(screen.getByText('£3,000')).toBeInTheDocument(); // income
    expect(screen.getByText('− £1,000')).toBeInTheDocument(); // committed costs
    expect(screen.getByText('− £500')).toBeInTheDocument(); // discretionary
    expect(screen.getByText('− £200')).toBeInTheDocument(); // planned savings
    expect(screen.getByText('− £150')).toBeInTheDocument(); // safety buffer
  });

  it('renders itemized committed bills sorted by amount, excluding inactive ones', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    billService.getBills.mockResolvedValue([
      makeBill({ id: 'b1', name: 'Netflix', amount: 15 }),
      makeBill({ id: 'b2', name: 'Rent', amount: 900 }),
      makeBill({ id: 'b3', name: 'Old gym', amount: 5000, isActive: false }),
    ]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Rent')).toBeInTheDocument());
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Old gym')).not.toBeInTheDocument();
  });

  it('renders itemized budgeted categories', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget({ categoryName: 'Groceries', amount: 400 })]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(screen.getByText('£400')).toBeInTheDocument();
  });

  it('shows an empty-state prompt when no budgets are set', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText(/no budgets set for this month/i)).toBeInTheDocument());
  });

  it('splits spending pots into envelope pots and sinking funds', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    potService.getPots.mockResolvedValue([
      makePot({ id: 'p1', name: 'Fuel', type: 'Fuel', budgetAmount: 150 }),
      makePot({ id: 'p2', name: 'Car insurance', type: 'SinkingFund', budgetAmount: 50 }),
    ]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Fuel')).toBeInTheDocument());
    expect(screen.getByText('Car insurance')).toBeInTheDocument();
    expect(screen.getByText(/sinking funds/i)).toBeInTheDocument();
  });

  it('renders active savings goals but excludes non-active ones', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    savingsGoalService.getGoals.mockResolvedValue([
      makeGoal({ goal: { ...makeGoal().goal, id: 'g1', name: 'Holiday', status: 'Active', monthlyContribution: 100 } }),
      makeGoal({ goal: { ...makeGoal().goal, id: 'g2', name: 'Old car fund', status: 'Achieved', monthlyContribution: 999 } }),
    ]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Holiday')).toBeInTheDocument());
    expect(screen.queryByText('Old car fund')).not.toBeInTheDocument();
  });

  it('renders itemized existing debt repayments using each debt’s resolved payment', async () => {
    // effectiveMonthlyPayment is resolved server-side (current → linked bill →
    // minimum) — the frontend just displays it, it doesn't re-derive it.
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ existingDebtPayments: 450 }));
    debtService.getOverview.mockResolvedValue({
      debts: [
        makeDebt({ accountId: 'd1', name: 'Barclaycard', effectiveMonthlyPayment: 100 }),
        makeDebt({ accountId: 'd2', name: 'Car loan', effectiveMonthlyPayment: 350 }),
      ],
      totalDebt: 5000, totalMinimumPayments: 400, totalCurrentPayments: 450,
    });
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Barclaycard')).toBeInTheDocument());
    expect(screen.getByText('£100')).toBeInTheDocument();
    expect(screen.getByText('Car loan')).toBeInTheDocument();
    expect(screen.getByText('£350')).toBeInTheDocument();
  });

  it('excludes a bill linked to a debt account from committed bills, since it’s counted under existing debt repayments instead', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ existingDebtPayments: 250 }));
    debtService.getOverview.mockResolvedValue({
      debts: [makeDebt({ accountId: 'd1', name: 'Mortgage', effectiveMonthlyPayment: 250 })],
      totalDebt: 5000, totalMinimumPayments: 250, totalCurrentPayments: 250,
    });
    billService.getBills.mockResolvedValue([
      makeBill({ id: 'b1', name: 'Mortgage DD', amount: 250, accountId: 'd1' }),
      makeBill({ id: 'b2', name: 'Netflix', amount: 15, accountId: null }),
    ]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.queryByText('Mortgage DD')).not.toBeInTheDocument();
  });

  it('shows an empty-state prompt when there are no debt repayments', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getByText(/no debt repayments found/i)).toBeInTheDocument());
  });

  it('labels discretionary spend as an estimate when no budgets or pots exist', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() =>
      expect(screen.getAllByText(/everyday spending \(estimated from transactions\)/i).length).toBeGreaterThan(0)
    );
  });

  it('labels discretionary spend as budgeted categories & pots when budgets exist', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget()]);
    renderWithProviders(<CashFlowSummary />);

    await waitFor(() => expect(screen.getAllByText(/budgeted categories & pots/i).length).toBeGreaterThan(0));
    expect(screen.queryByText(/estimated from transactions/i)).not.toBeInTheDocument();
  });
});
