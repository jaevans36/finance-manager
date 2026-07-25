import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { BillsIncomeSummary } from '../../src/components/finance/BillsIncomeSummary';
import type { AffordabilityData, Bill } from '../../src/types/finance';

jest.mock('../../src/services/affordability-service', () => ({
  affordabilityService: {
    getAffordability: jest.fn(),
  },
}));

const { affordabilityService } = jest.requireMock('../../src/services/affordability-service');

const makeAffordability = (overrides: Partial<AffordabilityData> = {}): AffordabilityData => ({
  monthlyIncome: 3000,
  incomeConfidence: 'High',
  incomeSource: 'Detected',
  committedCosts: 0,
  existingDebtPayments: 0,
  discretionarySpend: 0,
  plannedSavings: 0,
  emergencyBuffer: 0,
  safeSurplus: 0,
  suggestedDebtPayment: 0,
  calculatedAt: '',
  incomeAccountIds: [],
  ...overrides,
});

const makeBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: 'b1', userId: 'u1', name: 'Netflix', description: null,
  amount: 100, frequency: 'Monthly', dueDay: 1, reminderDaysBefore: 3,
  isPaid: false, lastPaidDate: null, categoryId: null, categoryName: 'Streaming & Media',
  isActive: true, createdAt: '', updatedAt: '',
  accountId: null, accountName: null,
  ...overrides,
});

describe('BillsIncomeSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prompts to set income when none is detected', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 0 }));
    renderWithProviders(<BillsIncomeSummary bills={[makeBill()]} />);
    await waitFor(() =>
      expect(screen.getByText(/set your monthly income/i)).toBeInTheDocument()
    );
  });

  it('shows income, bills total, and remaining when income is set', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 3000 }));
    const bills = [makeBill({ id: 'b1', amount: 100 }), makeBill({ id: 'b2', name: 'Mortgage', amount: 900, categoryName: 'Mortgage Payment' })];
    renderWithProviders(<BillsIncomeSummary bills={bills} />);

    await waitFor(() => expect(screen.getByText('£3,000')).toBeInTheDocument());
    expect(screen.getByText('£1,000')).toBeInTheDocument();
    expect(screen.getByText('£2,000')).toBeInTheDocument();
  });

  it('shows an overstretched warning when bills exceed income', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 500 }));
    const bills = [makeBill({ amount: 900 })];
    renderWithProviders(<BillsIncomeSummary bills={bills} />);

    await waitFor(() =>
      expect(screen.getByText(/more than your/i)).toBeInTheDocument()
    );
  });

  it('excludes inactive bills from the totals', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 1000 }));
    const bills = [makeBill({ amount: 100 }), makeBill({ id: 'b2', amount: 5000, isActive: false })];
    renderWithProviders(<BillsIncomeSummary bills={bills} />);

    await waitFor(() => expect(screen.getByText('£900')).toBeInTheDocument());
  });

  it('includes planned savings as a slice and subtracts it from remaining', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 3000, plannedSavings: 200 }));
    const bills = [makeBill({ amount: 1000 })];
    renderWithProviders(<BillsIncomeSummary bills={bills} />);

    await waitFor(() => expect(screen.getByText('Planned savings & upcoming costs')).toBeInTheDocument());
    expect(screen.getByText('£200')).toBeInTheDocument();
    // 3000 - 1000 - 200 = 1800 remaining
    expect(screen.getByText('£1,800')).toBeInTheDocument();
  });

  it('does not show a planned savings row when there is none', async () => {
    affordabilityService.getAffordability.mockResolvedValue(makeAffordability({ monthlyIncome: 3000, plannedSavings: 0 }));
    renderWithProviders(<BillsIncomeSummary bills={[makeBill({ amount: 100 })]} />);

    await waitFor(() => expect(screen.getByText('£3,000')).toBeInTheDocument());
    expect(screen.queryByText('Planned savings & upcoming costs')).not.toBeInTheDocument();
    expect(screen.queryByText('Planned savings')).not.toBeInTheDocument();
  });

  it('falls back gracefully when affordability data fails to load', async () => {
    affordabilityService.getAffordability.mockRejectedValue(new Error('network error'));
    renderWithProviders(<BillsIncomeSummary bills={[makeBill()]} />);

    await waitFor(() =>
      expect(screen.getByText(/set your monthly income/i)).toBeInTheDocument()
    );
  });
});
