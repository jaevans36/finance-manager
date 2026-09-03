import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetDashboard } from '../../src/components/finance/BudgetDashboard';
import type { Budget } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: {
    getCurrentBudgets: jest.fn(),
    getBudgets: jest.fn(),
    deleteBudget: jest.fn(),
    copyFromPrevious: jest.fn(),
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
  title: null,
  note: null,
  ...overrides,
});

describe('BudgetDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    budgetService.getBudgets.mockResolvedValue([]);
  });

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

  it('prefers the title over the category name when a title is set', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget({ title: 'Big shop' })]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Big shop')).toBeInTheDocument());
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('shows the note when one is set', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget({ note: 'Fortnightly big shop' })]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Fortnightly big shop')).toBeInTheDocument());
  });

  it('calls onEdit with the budget when the edit button is clicked', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget()]);
    const onEdit = jest.fn();
    renderWithProviders(<BudgetDashboard onEdit={onEdit} />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());

    await userEvent.click(screen.getByTitle('Edit budget'));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }));
  });

  it('requires a second click to confirm delete', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget()]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());

    await userEvent.click(screen.getByTitle('Delete budget'));
    expect(budgetService.deleteBudget).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() => expect(budgetService.deleteBudget).toHaveBeenCalledWith('b1'));
  });

  it('cancels the delete confirmation', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([makeBudget()]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());

    await userEvent.click(screen.getByTitle('Delete budget'));
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByText(/this cannot be undone/i)).not.toBeInTheDocument();
    expect(budgetService.deleteBudget).not.toHaveBeenCalled();
  });

  it('offers to copy last month\'s budgets when the current month is empty but the previous one has budgets', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    budgetService.getBudgets.mockResolvedValue([makeBudget()]);
    renderWithProviders(<BudgetDashboard />);

    await waitFor(() => expect(screen.getByText(/copy last month's budgets/i)).toBeInTheDocument());
  });

  it('does not offer to copy when the previous month also has no budgets', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    budgetService.getBudgets.mockResolvedValue([]);
    renderWithProviders(<BudgetDashboard />);

    await waitFor(() => expect(screen.getByText(/no budgets/i)).toBeInTheDocument());
    expect(screen.queryByText(/copy last month/i)).not.toBeInTheDocument();
  });

  it('calls copyFromPrevious when the copy button is clicked', async () => {
    budgetService.getCurrentBudgets.mockResolvedValue([]);
    budgetService.getBudgets.mockResolvedValue([makeBudget()]);
    renderWithProviders(<BudgetDashboard />);
    await waitFor(() => expect(screen.getByText(/copy last month's budgets/i)).toBeInTheDocument());

    budgetService.copyFromPrevious.mockResolvedValue([makeBudget()]);
    await userEvent.click(screen.getByText(/copy last month's budgets/i));

    await waitFor(() => expect(budgetService.copyFromPrevious).toHaveBeenCalled());
  });
});
