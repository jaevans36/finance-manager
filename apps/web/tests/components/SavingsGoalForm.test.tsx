import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { SavingsGoalForm } from '../../src/components/finance/SavingsGoalForm';

jest.mock('../../src/services/savings-goal-service', () => ({
  savingsGoalService: { createGoal: jest.fn() },
}));

const { savingsGoalService } = jest.requireMock('../../src/services/savings-goal-service');

describe('SavingsGoalForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires a name and a positive target amount', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoalForm onSuccess={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /save goal/i }));

    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    expect(savingsGoalService.createGoal).not.toHaveBeenCalled();
  });

  it('creates a goal with the entered fields', async () => {
    const user = userEvent.setup();
    savingsGoalService.createGoal.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<SavingsGoalForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/holiday, emergency fund/i), 'Washing machine');
    await user.type(screen.getByPlaceholderText(/target amount/i), '400');
    await user.type(screen.getByPlaceholderText(/monthly amount/i), '50');
    await user.click(screen.getByRole('button', { name: /save goal/i }));

    await waitFor(() => expect(savingsGoalService.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Washing machine', targetAmount: 400, monthlyContribution: 50 })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows a suggested monthly contribution once a target date is set, and fills the field on use', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoalForm onSuccess={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/target amount/i), '400');
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 4);
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, targetDate.toISOString().slice(0, 10));

    await waitFor(() => expect(screen.getByText(/suggested: £/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /use this/i }));

    const contributionInput = screen.getByPlaceholderText(/monthly amount/i) as HTMLInputElement;
    expect(parseFloat(contributionInput.value)).toBeGreaterThan(0);
  });

  it('does not show a suggestion when no target date is set', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoalForm onSuccess={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/target amount/i), '400');

    expect(screen.queryByText(/suggested: £/i)).not.toBeInTheDocument();
  });

  it('shows an error message when createGoal fails', async () => {
    const user = userEvent.setup();
    savingsGoalService.createGoal.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<SavingsGoalForm onSuccess={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/holiday, emergency fund/i), 'Test');
    await user.type(screen.getByPlaceholderText(/target amount/i), '100');
    await user.click(screen.getByRole('button', { name: /save goal/i }));

    await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
  });
});
