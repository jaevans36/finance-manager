import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { SpendingPots } from '../../src/components/finance/SpendingPots';
import type { SpendingPotWithProgress } from '../../src/types/finance';

jest.mock('../../src/services/pot-service', () => ({
  potService: { getPots: jest.fn(), contributeSinkingFund: jest.fn() },
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
  annualAmount: null,
  nextPaymentDate: null,
  accumulatedAmount: 0,
  monthlyAllocation: null,
  monthsRemaining: null,
  isReady: false,
  ...overrides,
});

const makeSinkingFund = (overrides: Partial<SpendingPotWithProgress> = {}): SpendingPotWithProgress => makePot({
  id: 'sf1',
  name: 'Car insurance',
  type: 'SinkingFund',
  budgetAmount: 50,
  spent: 300,
  remaining: 300,
  categoryIds: [],
  percentageUsed: 50,
  annualAmount: 600,
  nextPaymentDate: '2027-03-01',
  accumulatedAmount: 300,
  monthlyAllocation: 50,
  monthsRemaining: 6,
  isReady: false,
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

  // ── Sinking funds ────────────────────────────────────────────────────────

  it('renders a sinking fund pot with annual amount and monthly allocation', async () => {
    potService.getPots.mockResolvedValue([makeSinkingFund()]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Car insurance')).toBeInTheDocument());
    expect(screen.getByText(/£600\/yr/)).toBeInTheDocument();
    expect(screen.getByText(/£50\/mo/)).toBeInTheDocument();
  });

  it('shows months remaining until the next payment for a sinking fund', async () => {
    potService.getPots.mockResolvedValue([makeSinkingFund({ monthsRemaining: 6 })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText(/ready in 6m/i)).toBeInTheDocument());
  });

  it('shows a Ready badge when a sinking fund has reached its annual target', async () => {
    potService.getPots.mockResolvedValue([makeSinkingFund({ isReady: true, accumulatedAmount: 600 })]);
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Car insurance')).toBeInTheDocument());
    expect(screen.getAllByText(/ready/i).length).toBeGreaterThan(0);
  });

  it('sets aside this month\'s allocation when the contribute button is clicked', async () => {
    const user = userEvent.setup();
    potService.getPots.mockResolvedValue([makeSinkingFund()]);
    potService.contributeSinkingFund.mockResolvedValue(makeSinkingFund({ accumulatedAmount: 350 }));
    renderWithProviders(<SpendingPots />);
    await waitFor(() => expect(screen.getByText('Car insurance')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /set aside this month/i }));

    await waitFor(() => expect(potService.contributeSinkingFund).toHaveBeenCalledWith('sf1'));
  });
});
