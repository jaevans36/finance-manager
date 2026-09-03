import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { SpendingVelocity } from '../../src/components/finance/SpendingVelocity';
import type { SpendingVelocityResponse } from '../../src/types/finance';

const makeData = (overrides: Partial<SpendingVelocityResponse> = {}): SpendingVelocityResponse => ({
  daysElapsed: 10,
  daysInMonth: 30,
  totalSpentSoFar: 500,
  dailyAverage: 50,
  projectedMonthEndTotal: 1500,
  budgetTotal: null,
  projectedOverspend: null,
  categories: [],
  ...overrides,
});

describe('SpendingVelocity', () => {
  it('shows total spent and projected total', () => {
    renderWithProviders(<SpendingVelocity data={makeData()} />);

    expect(screen.getByText('£500')).toBeInTheDocument();
    expect(screen.getByText('£1,500')).toBeInTheDocument();
  });

  it('does not show budget pace when no budget is set', () => {
    renderWithProviders(<SpendingVelocity data={makeData()} />);

    expect(screen.queryByText('Budget pace')).not.toBeInTheDocument();
  });

  it('shows budget pace percentage when a budget exists', () => {
    renderWithProviders(<SpendingVelocity data={makeData({ budgetTotal: 1000 })} />);

    expect(screen.getByText('Budget pace')).toBeInTheDocument();
    expect(screen.getByText('50% of £1,000')).toBeInTheDocument();
  });

  it('shows overspend warning when projected to overspend', () => {
    renderWithProviders(
      <SpendingVelocity data={makeData({ budgetTotal: 1000, projectedOverspend: 500 })} />
    );

    expect(screen.getByText(/projected to overspend by £500/i)).toBeInTheDocument();
  });

  it('does not show overspend warning when under budget', () => {
    renderWithProviders(
      <SpendingVelocity data={makeData({ budgetTotal: 2000, projectedOverspend: 0 })} />
    );

    expect(screen.queryByText(/projected to overspend/i)).not.toBeInTheDocument();
  });
});
