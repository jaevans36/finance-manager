import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { BillsDashboard } from '../../src/components/finance/BillsDashboard';
import type { Bill, UpcomingBill } from '../../src/types/finance';

jest.mock('../../src/services/bill-service', () => ({
  billService: {
    getUpcoming: jest.fn(),
    getAllBills: jest.fn(),
  },
}));

const { billService } = jest.requireMock('../../src/services/bill-service');

const makeBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: 'b1', userId: 'u1', name: 'Netflix', description: null,
  amount: 9.99, frequency: 'Monthly', dueDay: 1, reminderDaysBefore: 3,
  isPaid: false, lastPaidDate: null, categoryId: null, categoryName: null,
  isActive: true, createdAt: '', updatedAt: '',
  accountId: null, accountName: null,
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
});
