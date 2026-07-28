import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { SavingsGoalsDashboard } from '../../src/components/finance/SavingsGoalsDashboard';
import type { SavingsGoalWithProjection } from '../../src/types/finance';

jest.mock('../../src/services/savings-goal-service', () => ({
  savingsGoalService: { getGoals: jest.fn() },
}));

const { savingsGoalService } = jest.requireMock('../../src/services/savings-goal-service');

const makeGoal = (overrides: Partial<SavingsGoalWithProjection> = {}): SavingsGoalWithProjection => ({
  goal: {
    id: 'g1', userId: 'u1', name: 'Holiday', targetAmount: 2000,
    currentAmount: 800, monthlyContribution: 200, status: 'Active',
    targetDate: null, createdAt: '', updatedAt: '',
  },
  percentageComplete: 40,
  monthsToTarget: 6,
  projectedCompletionDate: '2026-12-01',
  isOnTrack: true,
  ...overrides,
});

describe('SavingsGoalsDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    savingsGoalService.getGoals.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<SavingsGoalsDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders goal name and amounts after loading', async () => {
    savingsGoalService.getGoals.mockResolvedValue([makeGoal()]);
    renderWithProviders(<SavingsGoalsDashboard />);
    await waitFor(() => expect(screen.getByText('Holiday')).toBeInTheDocument());
    expect(screen.getByText(/£800/)).toBeInTheDocument();
    expect(screen.getByText(/£2000/)).toBeInTheDocument();
  });

  it('shows empty state when no goals exist', async () => {
    savingsGoalService.getGoals.mockResolvedValue([]);
    renderWithProviders(<SavingsGoalsDashboard />);
    await waitFor(() => expect(screen.getByText(/no savings goals/i)).toBeInTheDocument());
  });

  it('shows Achieved badge when goal is completed', async () => {
    savingsGoalService.getGoals.mockResolvedValue([
      makeGoal({ goal: { ...makeGoal().goal, status: 'Achieved' }, percentageComplete: 100, monthsToTarget: 0 }),
    ]);
    renderWithProviders(<SavingsGoalsDashboard />);
    // Badge text is exactly "Achieved" (no exclamation); projected label says "Achieved!"
    await waitFor(() => expect(screen.getByText('Achieved')).toBeInTheDocument());
  });

  it('shows Behind badge when goal is not on track', async () => {
    savingsGoalService.getGoals.mockResolvedValue([makeGoal({ isOnTrack: false })]);
    renderWithProviders(<SavingsGoalsDashboard />);
    await waitFor(() => expect(screen.getByText('Behind')).toBeInTheDocument());
  });

  it('shows error message when fetch fails', async () => {
    savingsGoalService.getGoals.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<SavingsGoalsDashboard />);
    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });
});
