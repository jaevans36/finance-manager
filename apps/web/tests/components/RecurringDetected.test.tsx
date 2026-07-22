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
  BillForm: (props: { defaultFrequency?: string; defaultDueDay?: number; categories?: unknown[] }) => (
    <div
      data-testid="bill-form"
      data-default-frequency={props.defaultFrequency}
      data-default-due-day={props.defaultDueDay}
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
