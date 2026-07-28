import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetDashboard } from '../../src/components/finance/BudgetDashboard';
import type { Budget } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: {
    getCurrentBudgets: jest.fn(),
  },
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'b1',
  categoryId: 'c1',
  categoryName: 'Groceries',
  categoryColour: '#22C55E',
  categoryIcon: 'shopping-cart',
  month: 6,
  year: 2025,
  amount: 200,
  spent: 0,
  rolloverFromPrevious: 0,
  percentageUsed: 0,
  isWarning: false,
  isExceeded: false,
  ...overrides,
});

describe('BudgetDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    budgetService.getCurrentBudgets.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<BudgetDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders budget name and amounts after loading', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget({ spent: 75, percentageUsed: 37.5 })]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(screen.getByText(/£75/)).toBeInTheDocument();
    expect(screen.getByText(/£200/)).toBeInTheDocument();
  });

  it('shows empty state when no budgets exist', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/no budgets/i)).toBeInTheDocument());
  });

  it('renders amber progress bar when budget is at warning threshold', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ spent: 80, percentageUsed: 80, isWarning: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('renders red progress bar when budget is exceeded', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ spent: 250, percentageUsed: 125, isExceeded: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('shows overspend amount when budget is exceeded', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([
      makeBudget({ amount: 200, spent: 250, percentageUsed: 125, isExceeded: true }),
    ]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/over by/i)).toBeInTheDocument());
  });

  it('shows error message when fetch fails', async () => {
    budgetService.getCurrentBudgets.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });
});
