import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { BillsDashboard } from '../../src/components/finance/BillsDashboard';
import type { UpcomingBill } from '../../src/types/finance';

jest.mock('../../src/services/bill-service', () => ({
  billService: { getUpcoming: jest.fn() },
}));

const { billService } = jest.requireMock('../../src/services/bill-service');

const makeUpcoming = (overrides: Partial<UpcomingBill> = {}): UpcomingBill => ({
  bill: {
    id: 'b1', userId: 'u1', name: 'Netflix', amount: 9.99,
    frequency: 'Monthly', dueDay: 1, reminderDaysBefore: 3,
    isPaid: false, lastPaidDate: null, categoryId: null,
    isActive: true, createdAt: '', updatedAt: '',
  },
  nextDueDate: '2026-06-15',
  daysUntilDue: 8,
  isReminderDue: false,
  ...overrides,
});

describe('BillsDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeleton while fetching', () => {
    billService.getUpcoming.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<BillsDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders bill name and amount after loading', async () => {
    billService.getUpcoming.mockResolvedValue([makeUpcoming()]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    // amount appears in both the bill row and the monthly total
    expect(screen.getAllByText(/£9\.99/).length).toBeGreaterThan(0);
  });

  it('shows empty state when no upcoming bills exist', async () => {
    billService.getUpcoming.mockResolvedValue([]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText(/no upcoming bills/i)).toBeInTheDocument());
  });

  it('highlights bill with amber border when reminder is due', async () => {
    billService.getUpcoming.mockResolvedValue([makeUpcoming({ isReminderDue: true })]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    expect(document.querySelector('.border-amber-300')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    billService.getUpcoming.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });

  it('shows monthly total from all bills', async () => {
    billService.getUpcoming.mockResolvedValue([
      makeUpcoming({ bill: { ...makeUpcoming().bill, amount: 10, frequency: 'Monthly' } }),
      makeUpcoming({ bill: { ...makeUpcoming().bill, id: 'b2', name: 'Spotify', amount: 5, frequency: 'Monthly' } }),
    ]);
    renderWithProviders(<BillsDashboard />);
    await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
    // The span element contains exactly the total with no surrounding text
    expect(screen.getByText('£15.00')).toBeInTheDocument();
  });
});
