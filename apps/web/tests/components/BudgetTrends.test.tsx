import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BudgetTrends } from '../../src/components/finance/BudgetTrends';
import type { BudgetTrendPoint } from '../../src/types/finance';

jest.mock('../../src/services/budget-service', () => ({
  budgetService: { getTrends: jest.fn() },
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 800, height: 300 }}>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Bar: ({ dataKey }: { dataKey: string }) => <g data-key={dataKey} />,
  XAxis: ({ dataKey }: { dataKey: string }) => <g data-axis={dataKey} />,
  YAxis: () => <g />,
  CartesianGrid: () => <g />,
  Tooltip: () => <g />,
  Legend: () => <g />,
}));

const { budgetService } = jest.requireMock('../../src/services/budget-service');

const makeTrendPoint = (month: number, budgeted: number, spent: number): BudgetTrendPoint => ({
  month,
  year: 2026,
  monthLabel: `Month ${month}`,
  categories: [
    { categoryName: 'Groceries', categoryColour: '#22C55E', budgeted, spent },
  ],
});

describe('BudgetTrends', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state while fetching', () => {
    budgetService.getTrends.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<BudgetTrends />);
    expect(screen.getByText(/loading trends/i)).toBeInTheDocument();
  });

  it('renders the chart after loading with data', async () => {
    budgetService.getTrends.mockResolvedValue([
      makeTrendPoint(1, 300, 250),
      makeTrendPoint(2, 300, 320),
    ]);
    renderWithProviders(<BudgetTrends />);
    await waitFor(() =>
      expect(screen.queryByText(/loading trends/i)).not.toBeInTheDocument()
    );
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows empty state when no trend data exists', async () => {
    budgetService.getTrends.mockResolvedValue([]);
    renderWithProviders(<BudgetTrends />);
    await waitFor(() =>
      expect(screen.getByText(/no budget data yet/i)).toBeInTheDocument()
    );
  });

  it('shows error message and retry button when fetch fails', async () => {
    budgetService.getTrends.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<BudgetTrends />);
    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('refetches when retry button is clicked', async () => {
    budgetService.getTrends
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue([makeTrendPoint(1, 300, 250)]);

    renderWithProviders(<BudgetTrends />);
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() =>
      expect(screen.queryByText(/loading trends/i)).not.toBeInTheDocument()
    );
    expect(budgetService.getTrends).toHaveBeenCalledTimes(2);
  });

  it('refetches when period selector is changed', async () => {
    budgetService.getTrends.mockResolvedValue([makeTrendPoint(1, 300, 250)]);
    renderWithProviders(<BudgetTrends />);
    await waitFor(() =>
      expect(screen.queryByText(/loading trends/i)).not.toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole('button', { name: '3M' }));

    await waitFor(() =>
      expect(budgetService.getTrends).toHaveBeenCalledWith(3)
    );
  });
});
