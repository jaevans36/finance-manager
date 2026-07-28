import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetForm } from '../../src/components/finance/BudgetForm';
import type { Category } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: { createBudget: jest.fn() },
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const mockCategories: Category[] = [
  { id: 'c1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
  { id: 'c2', name: 'Fuel', colour: '#3B82F6', icon: 'fuel', isSystem: true, parentId: null, children: null },
];

describe('BudgetForm', () => {
  beforeEach(() => jest.clearAllMocks());

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
});
