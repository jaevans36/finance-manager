import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { AnomalyAlerts } from '../../src/components/finance/AnomalyAlert';
import type { AnomalyAlert } from '../../src/types/finance';

const makeAlert = (overrides: Partial<AnomalyAlert> = {}): AnomalyAlert => ({
  id: 'new:tx1',
  type: 'NewMerchant',
  transactionId: 'tx1',
  merchantName: 'Electronics Store',
  amount: 250,
  transactionDate: '2026-06-20',
  description: 'First transaction with this merchant — £250.00 on 20 Jun 2026.',
  severity: 'Info',
  ...overrides,
});

describe('AnomalyAlerts', () => {
  it('shows empty state when there are no alerts', () => {
    renderWithProviders(<AnomalyAlerts alerts={[]} />);

    expect(screen.getByText('No unusual activity detected.')).toBeInTheDocument();
  });

  it('shows the merchant name and description for each alert', () => {
    renderWithProviders(<AnomalyAlerts alerts={[makeAlert()]} />);

    expect(screen.getByText('Electronics Store')).toBeInTheDocument();
    expect(screen.getByText(/First transaction with this merchant/)).toBeInTheDocument();
  });

  it('shows the severity badge', () => {
    renderWithProviders(<AnomalyAlerts alerts={[makeAlert({ severity: 'Warning' })]} />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('removes the alert when marked "Looks fine"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnomalyAlerts alerts={[makeAlert()]} />);

    await user.click(screen.getByRole('button', { name: 'Looks fine' }));

    expect(screen.getByText('All anomalies reviewed.')).toBeInTheDocument();
  });

  it('removes the alert when flagged for review', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnomalyAlerts alerts={[makeAlert()]} />);

    await user.click(screen.getByRole('button', { name: 'Flag for review' }));

    expect(screen.getByText('All anomalies reviewed.')).toBeInTheDocument();
  });
});
