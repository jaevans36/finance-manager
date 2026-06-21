import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { DebtBurndownDashboard } from '../../src/components/finance/DebtBurndownDashboard';
import type { DebtOverviewResponse, DebtProjectionResponse } from '../../src/types/finance';

jest.mock('../../src/services/debt-service', () => ({
  debtService: {
    getOverview: jest.fn(),
    getProjection: jest.fn(),
  },
}));

// Recharts renders SVG — mock it to avoid JSDOM layout issues
jest.mock('../../src/components/finance/DebtWaterfallChart', () => ({
  DebtWaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

const { debtService } = jest.requireMock('../../src/services/debt-service');

const makeOverview = (overrides: Partial<DebtOverviewResponse> = {}): DebtOverviewResponse => ({
  debts: [
    {
      accountId: 'd1',
      name: 'Barclaycard',
      type: 'Credit',
      balance: -1200,
      interestRate: 24.9,
      minimumMonthlyPayment: 25,
      currentMonthlyPayment: 100,
      promotionalRate: null,
      promotionalExpiry: null,
      loanEndDate: null,
      severityScore: 50,
      severityLabel: 'High',
      severityReason: null,
    },
  ],
  totalDebt: 1200,
  totalMinimumPayments: 25,
  totalCurrentPayments: 100,
  ...overrides,
});

const makeProjection = (): DebtProjectionResponse => ({
  strategy: 'Avalanche',
  monthsToFreedom: 14,
  estimatedFreedomDate: '2027-09',
  totalInterestPaid: 145.50,
  schedule: [
    {
      month: 1,
      label: '2026-08',
      balances: [{ accountId: 'd1', name: 'Barclaycard', balance: 1102 }],
      totalRemaining: 1102,
    },
  ],
  payoffOrder: [
    { accountId: 'd1', name: 'Barclaycard', monthPaidOff: 14, paidOffDate: '2027-09' },
  ],
});

describe('DebtBurndownDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    debtService.getProjection.mockResolvedValue(makeProjection());
  });

  it('shows loading state initially', () => {
    debtService.getOverview.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<DebtBurndownDashboard />);

    expect(screen.getByText(/loading debt overview/i)).toBeInTheDocument();
  });

  it('shows debt-free message when there are no debts', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview({ debts: [], totalDebt: 0, totalMinimumPayments: 0, totalCurrentPayments: 0 }));

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Debt-free!')).toBeInTheDocument();
    });
  });

  it('shows debt overview and strategy selector when debts exist', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    // Wait for loading to clear (overviewLoading starts true; clears after both promises resolve)
    await waitFor(() => {
      expect(screen.queryByText(/loading debt overview/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Debt overview')).toBeInTheDocument();
    expect(screen.getByText('Paydown calculator')).toBeInTheDocument();
    expect(screen.getByText('Avalanche')).toBeInTheDocument();
    expect(screen.getByText('Snowball')).toBeInTheDocument();
  });

  it('auto-runs Avalanche projection on load', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(debtService.getProjection).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: 'Avalanche' })
      );
    });
  });

  it('shows projection results after load', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    // 14 months = 1 yr 2 mo
    await waitFor(() => {
      expect(screen.getByText('1 yr 2 mo')).toBeInTheDocument();
    });
    expect(screen.getByTestId('waterfall-chart')).toBeInTheDocument();
  });

  it('runs new projection when strategy selector is submitted', async () => {
    const user = userEvent.setup();
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Paydown calculator')).toBeInTheDocument();
    });

    // Strategy buttons contain description text — match by partial accessible name
    await user.click(screen.getByRole('button', { name: /^snowball/i }));
    await user.click(screen.getByRole('button', { name: 'Calculate projection' }));

    await waitFor(() => {
      expect(debtService.getProjection).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: 'Snowball' })
      );
    });
  });

  it('shows error state when overview fails', async () => {
    debtService.getOverview.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load debt overview/i)).toBeInTheDocument();
    });
  });
});
