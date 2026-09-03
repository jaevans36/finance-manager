import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { DebtBurndownDashboard } from '../../src/components/finance/DebtBurndownDashboard';
import type { AffordabilityData, DebtOverviewResponse, DebtProjectionResponse } from '../../src/types/finance';

jest.mock('../../src/services/debt-service', () => ({
  debtService: {
    getOverview: jest.fn(),
    getProjection: jest.fn(),
  },
}));

jest.mock('../../src/services/affordability-service', () => ({
  affordabilityService: {
    getAffordability: jest.fn(),
  },
}));

jest.mock('../../src/services/income-stream-service', () => ({
  incomeStreamService: {
    getStreams: jest.fn(),
    createStream: jest.fn(),
    updateStream: jest.fn(),
    deleteStream: jest.fn(),
    detectFromAccount: jest.fn(),
  },
}));

jest.mock('../../src/services/accounts-service', () => ({
  accountsService: {
    getAccounts: jest.fn(),
  },
}));

// Recharts renders SVG — mock it to avoid JSDOM layout issues
jest.mock('../../src/components/finance/DebtWaterfallChart', () => ({
  DebtWaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

jest.mock('../../src/components/finance/DebtMonthlyTable', () => ({
  DebtMonthlyTable: () => <div data-testid="monthly-table" />,
}));

const { debtService } = jest.requireMock('../../src/services/debt-service');
const { affordabilityService } = jest.requireMock('../../src/services/affordability-service');
const { incomeStreamService } = jest.requireMock('../../src/services/income-stream-service');
const { accountsService } = jest.requireMock('../../src/services/accounts-service');

const makeOverview = (overrides: Partial<DebtOverviewResponse> = {}): DebtOverviewResponse => ({
  debts: [
    {
      accountId: 'd1',
      name: 'Barclaycard',
      type: 'Credit',
      balance: -1200,
      creditLimit: 2000,
      interestRate: 24.9,
      promotionalBalance: null,
      minimumMonthlyPayment: 25,
      currentMonthlyPayment: 100,
      promotionalRate: null,
      promotionalExpiry: null,
      loanEndDate: null,
      severityScore: 50,
      severityLabel: 'High',
      severityReason: null,
      monthlyInterestCost: 24.9,
      monthsToPayoffAtCurrentPayment: 13,
      payoffDateAtCurrentPayment: '2027-07',
      detectedMonthlyPayment: 100,
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
      payments: [{ accountId: 'd1', name: 'Barclaycard', minimumPaid: 100, extraPaid: 0, totalPaid: 100 }],
      totalPaidThisMonth: 100,
      paidOffThisMonth: [],
    },
  ],
  payoffOrder: [
    { accountId: 'd1', name: 'Barclaycard', monthPaidOff: 14, paidOffDate: '2027-09' },
  ],
  warnings: [],
});

const makeAffordability = (overrides: Partial<AffordabilityData> = {}): AffordabilityData => ({
  monthlyIncome: 3000,
  incomeConfidence: 'High',
  incomeSource: 'Detected',
  committedCosts: 800,
  existingDebtPayments: 0,
  discretionarySpend: 600,
  plannedSavings: 0,
  emergencyBuffer: 200,
  safeSurplus: 1400,
  suggestedDebtPayment: 1260,
  calculatedAt: '2026-06-21',
  incomeAccountIds: [],
  ...overrides,
});

describe('DebtBurndownDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    debtService.getProjection.mockResolvedValue(makeProjection());
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability());
    incomeStreamService.getStreams.mockResolvedValue([]);
    accountsService.getAccounts.mockResolvedValue([]);
  });

  it('shows loading state initially', () => {
    debtService.getOverview.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<DebtBurndownDashboard />);

    expect(screen.getByText(/loading debt overview/i)).toBeInTheDocument();
  });

  it('shows debt-free message when there are no debts', async () => {
    debtService.getOverview.mockResolvedValue(
      makeOverview({ debts: [], totalDebt: 0, totalMinimumPayments: 0, totalCurrentPayments: 0 })
    );

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Debt-free!')).toBeInTheDocument();
    });
  });

  it('shows recommendation card with suggested payment', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recommended monthly payment')).toBeInTheDocument();
    });
    expect(screen.getAllByText('£1,260').length).toBeGreaterThan(0);
  });

  it('shows a planned savings deduction row when the user has savings goals or sinking funds', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ plannedSavings: 50 }));
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => expect(screen.getByText(/planned savings & upcoming costs/i)).toBeInTheDocument());
    expect(screen.getByText('− £50')).toBeInTheDocument();
  });

  it('hides the planned savings row when there is none', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => expect(screen.getByText('Recommended monthly payment')).toBeInTheDocument());
    expect(screen.queryByText(/planned savings & upcoming costs/i)).not.toBeInTheDocument();
  });

  it('shows an existing debt repayments deduction row when debts have minimum payments', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ existingDebtPayments: 450 }));
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => expect(screen.getByText(/^existing debt repayments$/i)).toBeInTheDocument());
    expect(screen.getByText('− £450')).toBeInTheDocument();
  });

  it('hides the existing debt repayments row when there are none', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => expect(screen.getByText('Recommended monthly payment')).toBeInTheDocument());
    expect(screen.queryByText(/^existing debt repayments$/i)).not.toBeInTheDocument();
  });

  it('shows income-not-detected card when affordability has no income', async () => {
    affordabilityService.getAffordability.mockResolvedValue(
      makeAffordability({ monthlyIncome: 0, incomeConfidence: 'Low', incomeSource: 'Detected', safeSurplus: 0, suggestedDebtPayment: 0 })
    );
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Income not detected')).toBeInTheDocument();
    });
  });

  it('shows debt overview and strategy selector when debts exist', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/loading debt overview/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Debt overview')).toBeInTheDocument();
    expect(screen.getByText('Paydown calculator')).toBeInTheDocument();
    expect(screen.getByText('Avalanche')).toBeInTheDocument();
    expect(screen.getByText('Snowball')).toBeInTheDocument();
  });

  it('auto-runs Avalanche projection using the suggested payment', async () => {
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(debtService.getProjection).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: 'Avalanche', extraMonthlyPayment: 1260, excludedAccountIds: null })
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
    expect(screen.getByTestId('monthly-table')).toBeInTheDocument();
  });

  it('runs new projection when strategy selector is submitted', async () => {
    const user = userEvent.setup();
    debtService.getOverview.mockResolvedValue(makeOverview());

    renderWithProviders(<DebtBurndownDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Paydown calculator')).toBeInTheDocument();
    });

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
