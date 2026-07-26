import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { RecurringDetected } from '../../src/components/finance/RecurringDetected';
import type { RecurringPattern } from '../../src/types/finance';

jest.mock('../../src/services/bill-service', () => ({
  billService: {
    detectRecurring: jest.fn(),
  },
}));

// BillForm's own behaviour (category select, weekday select, submission) is
// covered by BillForm.test.tsx — stub it here so these tests can assert
// exactly what props RecurringDetected computes and passes down to it.
jest.mock('../../src/components/finance/BillForm', () => ({
  BillForm: (props: { defaultFrequency?: string; defaultDueDay?: number; defaultAccountId?: string; categories?: unknown[] }) => (
    <div
      data-testid="bill-form"
      data-default-frequency={props.defaultFrequency}
      data-default-due-day={props.defaultDueDay}
      data-default-account-id={props.defaultAccountId}
      data-categories-count={props.categories?.length ?? 0}
    />
  ),
}));

const { billService } = jest.requireMock('../../src/services/bill-service');

const mockCategories = [
  { id: 'cat-1', name: 'Streaming & Media', colour: null, icon: null, isSystem: true, parentId: null, children: null },
];

const makePattern = (overrides: Partial<RecurringPattern> = {}): RecurringPattern => ({
  merchantName: 'Netflix',
  averageAmount: 9.99,
  latestAmount: 9.99,
  minAmount: 9.99,
  maxAmount: 9.99,
  detectedFrequency: 'Monthly',
  patternType: 'Subscription',
  amountTrend: 'Stable',
  occurrencesInPeriod: 3,
  lastOccurrence: '2026-06-12',
  accountId: 'acc-1',
  accountName: 'Current',
  isLikelyInactive: false,
  ...overrides,
});

describe('RecurringDetected', () => {
  beforeEach(() => jest.clearAllMocks());

  it('scans and shows a detected pattern', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([makePattern()]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));

    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
  });

  it('shows which account the pattern was detected on', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([makePattern({ accountName: 'Barclays Current' })]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));

    await waitFor(() => expect(screen.getByText('Barclays Current')).toBeInTheDocument());
  });

  it('shows the same merchant on two different accounts as two separate patterns', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([
      makePattern({ accountId: 'acc-1', accountName: 'Current' }),
      makePattern({ accountId: 'acc-2', accountName: 'Savings' }),
    ]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));

    await waitFor(() => expect(screen.getAllByText('Netflix')).toHaveLength(2));
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('dismissing one account’s pattern does not dismiss the same merchant on another account', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([
      makePattern({ accountId: 'acc-1', accountName: 'Current' }),
      makePattern({ accountId: 'acc-2', accountName: 'Savings' }),
    ]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));
    await waitFor(() => expect(screen.getAllByText('Netflix')).toHaveLength(2));

    await user.click(screen.getAllByRole('button', { name: /dismiss/i })[0]);

    expect(screen.getAllByText('Netflix')).toHaveLength(1);
  });

  it('pre-fills the linked account when confirming a pattern as a bill', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([makePattern({ accountId: 'acc-9' })]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm as bill/i }));

    expect(screen.getByTestId('bill-form')).toHaveAttribute('data-default-account-id', 'acc-9');
  });

  it('passes categories through to BillForm when confirming a monthly pattern', async () => {
    const user = userEvent.setup();
    billService.detectRecurring.mockResolvedValue([makePattern({ detectedFrequency: 'Monthly' })]);

    renderWithProviders(<RecurringDetected categories={mockCategories} />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm as bill/i }));

    const form = screen.getByTestId('bill-form');
    expect(form).toHaveAttribute('data-categories-count', '1');
  });

  it('pre-fills the day-of-month as dueDay for a Monthly pattern', async () => {
    const user = userEvent.setup();
    // 2026-06-12 is the 12th of the month
    billService.detectRecurring.mockResolvedValue([makePattern({ detectedFrequency: 'Monthly', lastOccurrence: '2026-06-12' })]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm as bill/i }));

    expect(screen.getByTestId('bill-form')).toHaveAttribute('data-default-due-day', '12');
  });

  it('pre-fills the ISO weekday (not the day-of-month) as dueDay for a Weekly pattern', async () => {
    const user = userEvent.setup();
    // 2026-06-12 is a Friday -> ISO weekday 5, not day-of-month 12
    billService.detectRecurring.mockResolvedValue([makePattern({ detectedFrequency: 'Weekly', lastOccurrence: '2026-06-12' })]);

    renderWithProviders(<RecurringDetected />);
    await user.click(screen.getByRole('button', { name: /scan transactions/i }));
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm as bill/i }));

    const form = screen.getByTestId('bill-form');
    expect(form).toHaveAttribute('data-default-frequency', 'Weekly');
    expect(form).toHaveAttribute('data-default-due-day', '5');
  });
});
