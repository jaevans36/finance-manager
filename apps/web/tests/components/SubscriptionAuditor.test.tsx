import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { SubscriptionAuditor } from '../../src/components/finance/SubscriptionAuditor';
import type { SubscriptionAuditItem, SubscriptionAuditResponse } from '../../src/types/finance';

const makeItem = (overrides: Partial<SubscriptionAuditItem> = {}): SubscriptionAuditItem => ({
  merchantName: 'NETFLIX',
  monthlyCost: 15.99,
  annualCost: 191.88,
  frequency: 'Monthly',
  possiblyUnused: false,
  lastOccurrence: '2026-06-01',
  amountTrend: 'Stable',
  ...overrides,
});

const makeData = (items: SubscriptionAuditItem[] = [makeItem()]): SubscriptionAuditResponse => ({
  subscriptions: items,
  totalMonthlyCost: items.reduce((sum, i) => sum + i.monthlyCost, 0),
  totalAnnualCost: items.reduce((sum, i) => sum + i.annualCost, 0),
  possiblyUnusedCount: items.filter(i => i.possiblyUnused).length,
});

describe('SubscriptionAuditor', () => {
  it('shows empty state when there are no subscriptions', () => {
    renderWithProviders(<SubscriptionAuditor data={makeData([])} onNegotiate={jest.fn()} />);

    expect(screen.getByText('No recurring subscriptions detected yet.')).toBeInTheDocument();
  });

  it('lists each subscription with its merchant name', () => {
    renderWithProviders(<SubscriptionAuditor data={makeData()} onNegotiate={jest.fn()} />);

    expect(screen.getByText('NETFLIX')).toBeInTheDocument();
  });

  it('shows "Possibly unused" badge for inactive subscriptions', () => {
    renderWithProviders(
      <SubscriptionAuditor data={makeData([makeItem({ possiblyUnused: true })])} onNegotiate={jest.fn()} />
    );

    expect(screen.getByText('Possibly unused')).toBeInTheDocument();
  });

  it('shows "Price increasing" badge for increasing trend', () => {
    renderWithProviders(
      <SubscriptionAuditor data={makeData([makeItem({ amountTrend: 'Increasing' })])} onNegotiate={jest.fn()} />
    );

    expect(screen.getByText('Price increasing')).toBeInTheDocument();
  });

  it('calls onNegotiate with the merchant name when Negotiate is clicked', async () => {
    const user = userEvent.setup();
    const onNegotiate = jest.fn();
    renderWithProviders(<SubscriptionAuditor data={makeData()} onNegotiate={onNegotiate} />);

    await user.click(screen.getByRole('button', { name: /negotiate/i }));

    expect(onNegotiate).toHaveBeenCalledWith('NETFLIX');
  });

  it('removes a subscription from the list when marked reviewed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SubscriptionAuditor data={makeData()} onNegotiate={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Reviewed' }));

    expect(screen.getByText('All subscriptions reviewed.')).toBeInTheDocument();
  });
});
