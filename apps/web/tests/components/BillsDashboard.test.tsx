import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BillsDashboard } from '../../src/components/finance/BillsDashboard';
import type { Bill, UpcomingBill } from '../../src/types/finance';

jest.mock('../../src/services/bill-service', () => ({
  billService: {
    getUpcoming: jest.fn(),
    getAllBills: jest.fn(),
  },
}));

jest.mock('../../src/services/affordability-service', () => ({
  affordabilityService: {
    getAffordability: jest.fn(),
  },
}));

const { billService } = jest.requireMock('../../src/services/bill-service');
const { affordabilityService } = jest.requireMock('../../src/services/affordability-service');

const makeBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: 'b1', userId: 'u1', name: 'Netflix', description: null,
  amount: 9.99, frequency: 'Monthly', dueDay: 1, reminderDaysBefore: 3,
  isPaid: false, lastPaidDate: null, categoryId: null, categoryName: null,
  isActive: true, createdAt: '', updatedAt: '',
  accountId: null, accountName: null,
  linkedAccountPayment: null, hasPaymentMismatch: false,
  ...overrides,
});

const makeUpcoming = (bill: Bill, overrides: Partial<Omit<UpcomingBill, 'bill'>> = {}): UpcomingBill => ({
  bill,
  nextDueDate: '2026-06-15',
  daysUntilDue: 8,
  isReminderDue: false,
  ...overrides,
});

describe('BillsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    billService.getUpcoming.mockResolvedValue([]);
    billService.getAllBills.mockResolvedValue([]);
    affordabilityService.getAffordability.mockResolvedValue({
      monthlyIncome: 0, incomeConfidence: 'Low', incomeSource: 'Manual',
      committedCosts: 0, existingDebtPayments: 0, discretionarySpend: 0, emergencyBuffer: 0,
      safeSurplus: 0, suggestedDebtPayment: 0, calculatedAt: '', incomeAccountIds: [],
    });
  });

  it('shows loading skeleton while fetching', () => {
    billService.getUpcoming.mockReturnValue(new Promise(() => {}));
    billService.getAllBills.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<BillsDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders bill name and amount after loading', async () => {
    const bill = makeBill();
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getAllByText(/£9\.99/).length).toBeGreaterThan(0);
  });

  it('shows empty state when no active bills exist', async () => {
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText(/no active bills/i)).toBeInTheDocument());
  });

  it('highlights bill with amber border when reminder is due', async () => {
    const bill = makeBill();
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill, { isReminderDue: true })]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(document.querySelector('.border-amber-300')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    billService.getUpcoming.mockRejectedValue(new Error('Network error'));
    billService.getAllBills.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });

  it('shows monthly total from all active bills', async () => {
    const bill1 = makeBill({ id: 'b1', name: 'Netflix', amount: 10 });
    const bill2 = makeBill({ id: 'b2', name: 'Spotify', amount: 5 });
    billService.getAllBills.mockResolvedValue([bill1, bill2]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill1), makeUpcoming(bill2)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getByText('£15.00')).toBeInTheDocument();
  });

  it('includes weekly bills in the monthly total at their monthly-equivalent rate', async () => {
    const bill = makeBill({ id: 'b1', name: 'Personal Trainer', amount: 22, frequency: 'Weekly' });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Personal Trainer')).toBeInTheDocument());
    // 22 * 52 / 12 = 95.33
    expect(screen.getByText('£95.33')).toBeInTheDocument();
  });

  it('shows a monthly-equivalent hint next to a non-monthly bill amount', async () => {
    const bill = makeBill({ id: 'b1', name: 'Personal Trainer', amount: 22, frequency: 'Weekly' });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Personal Trainer')).toBeInTheDocument());
    expect(screen.getByText('≈£95.33/mo')).toBeInTheDocument();
  });

  it('does not show a monthly-equivalent hint for monthly bills', async () => {
    const bill = makeBill({ id: 'b1', name: 'Netflix', amount: 10, frequency: 'Monthly' });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.queryByText(/≈£/)).not.toBeInTheDocument();
  });

  it('shows linked account name when bill is linked to an account', async () => {
    const bill = makeBill({ accountId: 'acc-1', accountName: 'Barclays Current' });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getByText(/Barclays Current/)).toBeInTheDocument();
  });

  it('shows "Not linked" when bill has no linked account', async () => {
    const bill = makeBill({ accountId: null, accountName: null });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getByText(/Not linked/)).toBeInTheDocument();
  });

  it('shows a mismatch warning when the bill amount disagrees with the linked account payment', async () => {
    const bill = makeBill({
      accountId: 'acc-1', accountName: 'Natwest - Credit Card',
      hasPaymentMismatch: true, linkedAccountPayment: 120,
    });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getByText(/doesn.t match natwest - credit card.s payment/i)).toBeInTheDocument();
    expect(screen.getByText(/£120\.00\/mo/)).toBeInTheDocument();
  });

  it('does not show a mismatch warning when the bill agrees with the linked account', async () => {
    const bill = makeBill({
      accountId: 'acc-1', accountName: 'Natwest - Credit Card',
      hasPaymentMismatch: false, linkedAccountPayment: 9.99,
    });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.queryByText(/doesn.t match/i)).not.toBeInTheDocument();
  });

  it('shows category name when bill has a category', async () => {
    const bill = makeBill({ categoryId: 'cat-1', categoryName: 'Streaming & Media' });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(screen.getByText(/Streaming & Media/)).toBeInTheDocument();
  });

  it('does not show a category badge when bill has no category', async () => {
    const bill = makeBill({ categoryId: null, categoryName: null });
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(document.querySelector('.text-purple-600')).not.toBeInTheDocument();
  });

  it('filters the bill list by search term', async () => {
    const bill1 = makeBill({ id: 'b1', name: 'Netflix', amount: 10 });
    const bill2 = makeBill({ id: 'b2', name: 'Spotify', amount: 5 });
    billService.getAllBills.mockResolvedValue([bill1, bill2]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill1), makeUpcoming(bill2)]);
    const user = userEvent.setup();
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/search bills/i), 'spot');

    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    expect(screen.getByText('Spotify')).toBeInTheDocument();
  });

  it('shows a search-specific empty state when no bills match', async () => {
    const bill = makeBill();
    billService.getAllBills.mockResolvedValue([bill]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(bill)]);
    const user = userEvent.setup();
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/search bills/i), 'nonexistent');

    expect(screen.getByText(/no bills match your search/i)).toBeInTheDocument();
  });

  it('sorts the bill list alphabetically by name when selected', async () => {
    const bill1 = makeBill({ id: 'b1', name: 'Zebra Broadband', amount: 10 });
    const bill2 = makeBill({ id: 'b2', name: 'Apple Music', amount: 5 });
    billService.getAllBills.mockResolvedValue([bill1, bill2]);
    billService.getUpcoming.mockResolvedValue([
      makeUpcoming(bill1, { daysUntilDue: 1 }),
      makeUpcoming(bill2, { daysUntilDue: 20 }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Zebra Broadband')).toBeInTheDocument());

    await user.selectOptions(screen.getByDisplayValue(/due date/i), 'name');

    const names = screen.getAllByText(/Broadband|Music/).map(el => el.textContent);
    expect(names.indexOf('Apple Music')).toBeLessThan(names.indexOf('Zebra Broadband'));
  });

  it('sorts by monthly cost, not raw per-period amount, so a weekly bill outranks a bigger-looking monthly one', async () => {
    // £22/week ≈ £95.26/mo — higher monthly cost than a flat £50/mo bill despite the smaller raw figure
    const weekly = makeBill({ id: 'b1', name: 'Personal Trainer', amount: 22, frequency: 'Weekly' });
    const monthly = makeBill({ id: 'b2', name: 'Broadband', amount: 50, frequency: 'Monthly' });
    billService.getAllBills.mockResolvedValue([weekly, monthly]);
    billService.getUpcoming.mockResolvedValue([makeUpcoming(weekly), makeUpcoming(monthly)]);
    const user = userEvent.setup();
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Personal Trainer')).toBeInTheDocument());

    await user.selectOptions(screen.getByDisplayValue(/due date/i), 'amount');

    const names = screen.getAllByText(/Personal Trainer|Broadband/).map(el => el.textContent);
    expect(names.indexOf('Personal Trainer')).toBeLessThan(names.indexOf('Broadband'));
  });
});
