import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { SpendingPots } from '../../src/components/finance/SpendingPots';
import type { SpendingPotWithProgress } from '../../src/types/finance';

jest.mock('../../src/services/pot-service', () => ({
  potService: { getPots: jest.fn() },
}));

const { potService } = jest.requireMock('../../src/services/pot-service');

const makePot = (overrides: Partial<SpendingPotWithProgress> = {}): SpendingPotWithProgress => ({
  id: 'p1',
  name: 'Groceries',
  type: 'Groceries',
  budgetAmount: 300,
  spent: 0,
  remaining: 300,
  rolloverEnabled: false,
  icon: 'shopping-cart',
  colour: '#22C55E',
  categoryIds: [],
  percentageUsed: 0,
  isWarning: false,
  isExceeded: false,
  ...overrides,
});

describe('SpendingPots', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    potService.getPots.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<SpendingPots />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders pot name, budget, and remaining after loading', async () => {
    potService.getPots.mockResolvedValue([makePot({ spent: 120, remaining: 180 })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(screen.getByText(/£300/)).toBeInTheDocument();
    expect(screen.getByText(/£180/)).toBeInTheDocument();
  });

  it('shows empty state when no pots exist', async () => {
    potService.getPots.mockResolvedValue([]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/no spending pots/i)).toBeInTheDocument());
  });

  it('shows warning colour when pot is at warning threshold', async () => {
    potService.getPots.mockResolvedValue([makePot({ percentageUsed: 80, isWarning: true })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument());
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('shows rollover badge when rolloverEnabled is true', async () => {
    potService.getPots.mockResolvedValue([makePot({ rolloverEnabled: true })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/rollover/i)).toBeInTheDocument());
  });

  it('shows error message when fetch fails', async () => {
    potService.getPots.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });
});
