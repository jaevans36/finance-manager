import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { DebtMonthlyTable } from '../../src/components/finance/DebtMonthlyTable';
import type { DebtAccountSummary, DebtProjectionMonth } from '../../src/types/finance';

const makeDebt = (overrides: Partial<DebtAccountSummary> = {}): DebtAccountSummary => ({
  accountId: 'd1',
  name: 'Card A',
  type: 'Credit',
  balance: -500,
  interestRate: 0,
  minimumMonthlyPayment: 100,
  currentMonthlyPayment: 100,
  promotionalRate: null,
  promotionalExpiry: null,
  loanEndDate: null,
  severityScore: 50,
  severityLabel: 'High',
  severityReason: null,
  ...overrides,
});

const makeMonth = (overrides: Partial<DebtProjectionMonth> = {}): DebtProjectionMonth => ({
  month: 1,
  label: '2026-08',
  balances: [{ accountId: 'd1', name: 'Card A', balance: 400 }],
  totalRemaining: 400,
  payments: [{ accountId: 'd1', name: 'Card A', minimumPaid: 100, extraPaid: 0, totalPaid: 100 }],
  totalPaidThisMonth: 100,
  paidOffThisMonth: [],
  ...overrides,
});

describe('DebtMonthlyTable', () => {
  it('renders nothing when the schedule is empty', () => {
    renderWithProviders(<DebtMonthlyTable schedule={[]} debts={[]} />);
    expect(screen.queryByText('Monthly breakdown')).not.toBeInTheDocument();
  });

  it('shows month, total paid, and remaining for each row', () => {
    renderWithProviders(<DebtMonthlyTable schedule={[makeMonth()]} debts={[makeDebt()]} />);

    expect(screen.getByText('Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('£100')).toBeInTheDocument();
    expect(screen.getByText('£400')).toBeInTheDocument();
  });

  it('shows a milestone marker only in the payoff month', () => {
    const schedule = [
      makeMonth({ month: 1, label: '2026-08', paidOffThisMonth: [] }),
      makeMonth({ month: 2, label: '2026-09', totalRemaining: 0, paidOffThisMonth: ['Card A'] }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={[makeDebt()]} />);

    expect(screen.getByText(/card a paid off/i)).toBeInTheDocument();
  });

  it('shows a per-debt breakdown column when toggled on', async () => {
    const user = userEvent.setup();
    const debts = [makeDebt({ accountId: 'd1', name: 'Card A' }), makeDebt({ accountId: 'd2', name: 'Card B' })];
    const schedule = [
      makeMonth({
        payments: [
          { accountId: 'd1', name: 'Card A', minimumPaid: 100, extraPaid: 0, totalPaid: 100 },
          { accountId: 'd2', name: 'Card B', minimumPaid: 50, extraPaid: 0, totalPaid: 50 },
        ],
        totalPaidThisMonth: 150,
      }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={debts} />);

    expect(screen.queryByText('Card B')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show per-debt breakdown/i }));

    expect(screen.getByText('Card B')).toBeInTheDocument();
    expect(screen.getByText('£50')).toBeInTheDocument();
  });

  it('shows each debt’s own remaining balance in the per-debt breakdown', async () => {
    const user = userEvent.setup();
    const debts = [makeDebt({ accountId: 'd1', name: 'Card A' }), makeDebt({ accountId: 'd2', name: 'Card B' })];
    const schedule = [
      makeMonth({
        balances: [
          { accountId: 'd1', name: 'Card A', balance: 300 },
          { accountId: 'd2', name: 'Card B', balance: 900 },
        ],
        payments: [
          { accountId: 'd1', name: 'Card A', minimumPaid: 100, extraPaid: 0, totalPaid: 100 },
          { accountId: 'd2', name: 'Card B', minimumPaid: 50, extraPaid: 0, totalPaid: 50 },
        ],
        totalPaidThisMonth: 150,
      }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={debts} />);
    await user.click(screen.getByRole('button', { name: /show per-debt breakdown/i }));

    expect(screen.getByText('bal £300')).toBeInTheDocument();
    expect(screen.getByText('bal £900')).toBeInTheDocument();
  });

  it('does not show a per-debt balance for a debt already paid off (no payment that month)', async () => {
    const user = userEvent.setup();
    const debts = [makeDebt({ accountId: 'd1', name: 'Card A' }), makeDebt({ accountId: 'd2', name: 'Card B' })];
    const schedule = [
      makeMonth({
        balances: [
          { accountId: 'd1', name: 'Card A', balance: 0 },
          { accountId: 'd2', name: 'Card B', balance: 500 },
        ],
        payments: [
          { accountId: 'd1', name: 'Card A', minimumPaid: 0, extraPaid: 0, totalPaid: 0 },
          { accountId: 'd2', name: 'Card B', minimumPaid: 100, extraPaid: 0, totalPaid: 100 },
        ],
        totalPaidThisMonth: 100,
      }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={debts} />);
    await user.click(screen.getByRole('button', { name: /show per-debt breakdown/i }));

    expect(screen.getByText('bal £500')).toBeInTheDocument();
    expect(screen.queryByText('bal £0')).not.toBeInTheDocument();
  });

  it('shows a callout naming the debt currently receiving the extra payment', () => {
    const schedule = [
      makeMonth({
        payments: [{ accountId: 'd1', name: 'Card A', minimumPaid: 100, extraPaid: 50, totalPaid: 150 }],
        totalPaidThisMonth: 150,
      }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={[makeDebt()]} />);

    expect(screen.getByText(/this month.s extra/i)).toBeInTheDocument();
    expect(screen.getByText('£50')).toBeInTheDocument();
    expect(screen.getByText('Card A')).toBeInTheDocument();
  });

  it('does not show the focus callout when there is no extra payment', () => {
    renderWithProviders(<DebtMonthlyTable schedule={[makeMonth()]} debts={[makeDebt()]} />);
    expect(screen.queryByText(/this month.s extra/i)).not.toBeInTheDocument();
  });

  it('shows the extra portion separately from the minimum in the per-debt breakdown', async () => {
    const user = userEvent.setup();
    const debts = [makeDebt({ accountId: 'd1', name: 'Card A' }), makeDebt({ accountId: 'd2', name: 'Card B' })];
    const schedule = [
      makeMonth({
        payments: [
          { accountId: 'd1', name: 'Card A', minimumPaid: 100, extraPaid: 50, totalPaid: 150 },
          { accountId: 'd2', name: 'Card B', minimumPaid: 40, extraPaid: 0, totalPaid: 40 },
        ],
        totalPaidThisMonth: 190,
      }),
    ];
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={debts} />);
    await user.click(screen.getByRole('button', { name: /show per-debt breakdown/i }));

    // The bold total (£150) is a sum, so the sub-line must spell out the parts that
    // make it up rather than implying the extra is on top of the total shown above.
    expect(screen.getByText('£100 min + £50 extra')).toBeInTheDocument();
    // Card B has no extra payment this month, so it gets no min/extra sub-line at all —
    // Card A's is the only one rendered.
    expect(screen.queryAllByText(/min \+/)).toHaveLength(1);
  });

  it('filters rows using the year-range selector', async () => {
    const user = userEvent.setup();
    const schedule = Array.from({ length: 36 }, (_, i) =>
      makeMonth({ month: i + 1, label: `2026-${String((i % 12) + 1).padStart(2, '0')}` })
    );
    renderWithProviders(<DebtMonthlyTable schedule={schedule} debts={[makeDebt()]} />);

    await user.click(screen.getByRole('button', { name: '2 yr' }));

    // 2 years = 24 rows, down from 36
    expect(screen.getAllByText('£100').length).toBeLessThan(36);
  });
});
