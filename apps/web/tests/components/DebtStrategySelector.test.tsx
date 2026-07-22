import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { DebtStrategySelector } from '../../src/components/finance/DebtStrategySelector';
import type { DebtAccountSummary } from '../../src/types/finance';

const makeDebt = (overrides: Partial<DebtAccountSummary> = {}): DebtAccountSummary => ({
  accountId: 'd1',
  name: 'Test Credit Card',
  type: 'Credit',
  balance: -1500,
  creditLimit: 3000,
  interestRate: 24.9,
  promotionalBalance: null,
  minimumMonthlyPayment: 30,
  currentMonthlyPayment: 100,
  promotionalRate: null,
  promotionalExpiry: null,
  loanEndDate: null,
  severityScore: 50,
  severityLabel: 'High',
  severityReason: null,
  monthlyInterestCost: null,
  monthsToPayoffAtCurrentPayment: null,
  payoffDateAtCurrentPayment: null,
  detectedMonthlyPayment: null,
  ...overrides,
});

describe('DebtStrategySelector', () => {
  it('shows interest rate for each debt in the "Debts to target" list', () => {
    const debts = [makeDebt({ accountId: 'd1', name: 'Barclaycard' }), makeDebt({ accountId: 'd2', name: 'HSBC Loan' })];

    renderWithProviders(<DebtStrategySelector debts={debts} onSubmit={jest.fn()} />);

    expect(screen.getByText('Debts to target')).toBeInTheDocument();
    expect(screen.getAllByText('24.9%').length).toBeGreaterThan(0);
  });

  it('shows the promo end date when a debt has a promotional expiry', () => {
    const debts = [
      makeDebt({ accountId: 'd1', name: 'Barclaycard', promotionalExpiry: '2026-09-01' }),
      makeDebt({ accountId: 'd2', name: 'HSBC Loan' }),
    ];

    renderWithProviders(<DebtStrategySelector debts={debts} onSubmit={jest.fn()} />);

    expect(screen.getByText('Promo ends 2026-09-01')).toBeInTheDocument();
  });

  it('does not show a promo end date when a debt has none', () => {
    const debts = [
      makeDebt({ accountId: 'd1', name: 'Barclaycard', promotionalExpiry: null }),
      makeDebt({ accountId: 'd2', name: 'HSBC Loan', promotionalExpiry: null }),
    ];

    renderWithProviders(<DebtStrategySelector debts={debts} onSubmit={jest.fn()} />);

    expect(screen.queryByText(/Promo ends/)).not.toBeInTheDocument();
  });

  it('does not show the "Debts to target" list when there is only one debt', () => {
    const debts = [makeDebt({ accountId: 'd1', name: 'Barclaycard' })];

    renderWithProviders(<DebtStrategySelector debts={debts} onSubmit={jest.fn()} />);

    expect(screen.queryByText('Debts to target')).not.toBeInTheDocument();
  });
});
