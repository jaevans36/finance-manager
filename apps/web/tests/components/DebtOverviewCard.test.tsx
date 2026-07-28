import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { DebtOverviewCard } from '../../src/components/finance/DebtOverviewCard';
import type { DebtAccountSummary } from '../../src/types/finance';

const makeDebt = (overrides: Partial<DebtAccountSummary> = {}): DebtAccountSummary => ({
  accountId: 'd1',
  name: 'Test Credit Card',
  type: 'Credit',
  balance: -1500,
  interestRate: 24.9,
  minimumMonthlyPayment: 30,
  currentMonthlyPayment: 100,
  promotionalRate: null,
  promotionalExpiry: null,
  loanEndDate: null,
  severityScore: 50,
  severityLabel: 'High',
  severityReason: null,
  ...overrides,
});

describe('DebtOverviewCard', () => {
  it('shows debt-free state when there are no debts', () => {
    renderWithProviders(
      <DebtOverviewCard debts={[]} totalDebt={0} totalMinimumPayments={0} totalCurrentPayments={0} />
    );

    expect(screen.getByText('Debt-free!')).toBeInTheDocument();
  });

  it('shows total debt amount', () => {
    const debts = [makeDebt({ balance: -1500 }), makeDebt({ accountId: 'd2', name: 'Loan', balance: -3000 })];

    renderWithProviders(
      <DebtOverviewCard
        debts={debts}
        totalDebt={4500}
        totalMinimumPayments={75}
        totalCurrentPayments={200}
      />
    );

    expect(screen.getByText('£4,500')).toBeInTheDocument();
  });

  it('shows each debt name', () => {
    const debts = [
      makeDebt({ name: 'Barclaycard' }),
      makeDebt({ accountId: 'd2', name: 'HSBC Loan', balance: -2000 }),
    ];

    renderWithProviders(
      <DebtOverviewCard debts={debts} totalDebt={3500} totalMinimumPayments={55} totalCurrentPayments={200} />
    );

    expect(screen.getByText('Barclaycard')).toBeInTheDocument();
    expect(screen.getByText('HSBC Loan')).toBeInTheDocument();
  });

  it('shows severity badge for each debt', () => {
    const debts = [
      makeDebt({ severityLabel: 'Critical', severityReason: 'Promotional deal expires in 5 days' }),
    ];

    renderWithProviders(
      <DebtOverviewCard debts={debts} totalDebt={1500} totalMinimumPayments={30} totalCurrentPayments={100} />
    );

    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Promotional deal expires in 5 days')).toBeInTheDocument();
  });

  it('shows minimum and current monthly payments', () => {
    const debts = [makeDebt({ minimumMonthlyPayment: 25, currentMonthlyPayment: 150 })];

    renderWithProviders(
      <DebtOverviewCard debts={debts} totalDebt={1500} totalMinimumPayments={25} totalCurrentPayments={150} />
    );

    expect(screen.getByText('Min: £25/mo')).toBeInTheDocument();
    expect(screen.getByText('Paying: £150/mo')).toBeInTheDocument();
  });

  it('shows interest rate in debt details', () => {
    const debts = [makeDebt({ interestRate: 19.9 })];

    renderWithProviders(
      <DebtOverviewCard debts={debts} totalDebt={1500} totalMinimumPayments={30} totalCurrentPayments={100} />
    );

    expect(screen.getByText(/19\.9% APR/)).toBeInTheDocument();
  });
});
