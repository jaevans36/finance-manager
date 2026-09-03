import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetForm } from '../../src/components/finance/BudgetForm';
import type { Category } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: { createBudget: jest.fn(), updateBudget: jest.fn(), getSuggested: jest.fn() },
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const mockCategories: Category[] = [
  { id: 'c1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
  { id: 'c2', name: 'Fuel', colour: '#3B82F6', icon: 'fuel', isSystem: true, parentId: null, children: null },
];

describe('BudgetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    budgetService.getSuggested.mockResolvedValue({ suggestedAmount: null, transactionCount: 0 });
  });

  it('renders category selector and amount input', () => {
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/amount/i)).toBeInTheDocument();
  });

  it('shows validation error when amount is empty and form is submitted', async () => {
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/required/i)).toBeInTheDocument());
  });

  it('calls createBudget with correct values on valid submit', async () => {
    budgetService.createBudget.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '200');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(budgetService.createBudget).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1', amount: 200 })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error message when createBudget fails', async () => {
    budgetService.createBudget.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '100');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });

  it('shows a suggested amount based on the last 3 months and fills the field on use', async () => {
    budgetService.getSuggested.mockResolvedValue({ suggestedAmount: 275.5, transactionCount: 6 });
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);

    await waitFor(() => expect(screen.getByText(/suggested: £275\.50/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /use this/i }));

    expect(screen.getByPlaceholderText(/amount/i)).toHaveValue(275.5);
  });

  it('does not show a suggestion when there is no spend history for the category', async () => {
    budgetService.getSuggested.mockResolvedValue({ suggestedAmount: null, transactionCount: 0 });
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);

    await waitFor(() => expect(budgetService.getSuggested).toHaveBeenCalledWith('c1'));
    expect(screen.queryByText(/suggested:/i)).not.toBeInTheDocument();
  });

  it('includes title and note in createBudget when provided', async () => {
    budgetService.createBudget.mockResolvedValue({});
    renderWithProviders(<BudgetForm categories={mockCategories} onSuccess={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/big shop/i), 'Weekly shop');
    await userEvent.type(screen.getByPlaceholderText(/amount/i), '200');
    await userEvent.type(screen.getByPlaceholderText(/any extra detail/i), 'Includes nappies');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(budgetService.createBudget).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Weekly shop', note: 'Includes nappies' })
    ));
  });

  it('pre-fills fields and disables the category selector in edit mode', () => {
    renderWithProviders(
      <BudgetForm
        categories={mockCategories}
        onSuccess={jest.fn()}
        budgetId="b1"
        initialData={{
          id: 'b1', categoryId: 'c2', categoryName: 'Fuel', categoryColour: '#3B82F6', categoryIcon: 'fuel',
          month: 6, year: 2025, amount: 150, spent: 0, rolloverFromPrevious: 0, percentageUsed: 0,
          isWarning: false, isExceeded: false, title: 'Petrol', note: 'Top up weekly',
        }}
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('combobox')).toHaveValue('c2');
    expect(screen.getByPlaceholderText(/big shop/i)).toHaveValue('Petrol');
    expect(screen.getByPlaceholderText(/amount/i)).toHaveValue(150);
    expect(screen.getByPlaceholderText(/any extra detail/i)).toHaveValue('Top up weekly');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls updateBudget instead of createBudget when editing', async () => {
    budgetService.updateBudget.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(
      <BudgetForm
        categories={mockCategories}
        onSuccess={onSuccess}
        budgetId="b1"
        initialData={{
          id: 'b1', categoryId: 'c1', categoryName: 'Groceries', categoryColour: '#22C55E', categoryIcon: 'shopping-cart',
          month: 6, year: 2025, amount: 150, spent: 0, rolloverFromPrevious: 0, percentageUsed: 0,
          isWarning: false, isExceeded: false, title: null, note: null,
        }}
      />
    );

    const amountInput = screen.getByPlaceholderText(/amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '175');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(budgetService.updateBudget).toHaveBeenCalledWith('b1',
      expect.objectContaining({ amount: 175 })
    ));
    expect(budgetService.createBudget).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });
});
