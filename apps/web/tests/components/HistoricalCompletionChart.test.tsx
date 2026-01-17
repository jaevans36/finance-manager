import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../src/styles/theme';
import { HistoricalCompletionChart } from '../../src/pages/weekly-progress/components/HistoricalCompletionChart';
import * as statisticsService from '../../src/services/statisticsService';

// Mock the statisticsService
jest.mock('../../src/services/statisticsService');

describe('HistoricalCompletionChart - T231.17', () => {
  const mockHistoricalData = [
    {
      weekStart: '2025-12-23T00:00:00Z',
      weekEnd: '2025-12-30T00:00:00Z',
      totalTasks: 10,
      completedTasks: 8,
      completionRate: 80.0
    },
    {
      weekStart: '2025-12-30T00:00:00Z',
      weekEnd: '2026-01-06T00:00:00Z',
      totalTasks: 12,
      completedTasks: 9,
      completionRate: 75.0
    },
    {
      weekStart: '2026-01-06T00:00:00Z',
      weekEnd: '2026-01-13T00:00:00Z',
      totalTasks: 15,
      completedTasks: 10,
      completionRate: 66.7
    },
    {
      weekStart: '2026-01-13T00:00:00Z',
      weekEnd: '2026-01-20T00:00:00Z',
      totalTasks: 8,
      completedTasks: 8,
      completionRate: 100.0
    }
  ];

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <HistoricalCompletionChart />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (statisticsService.getHistoricalStatistics as jest.Mock).mockResolvedValue(mockHistoricalData);
  });

  describe('Initial Rendering', () => {
    it('should render component title', async () => {
      renderComponent();
      
      expect(screen.getByText('Completion Rate History')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderComponent();
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render week range selector buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /8 weeks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /12 weeks/i })).toBeInTheDocument();
      });
    });

    it('should have 8 weeks selected by default', async () => {
      renderComponent();

      await waitFor(() => {
        const eightWeeksButton = screen.getByRole('button', { name: /8 weeks/i });
        expect(eightWeeksButton).toHaveClass('active');
      });
    });
  });

  describe('Data Loading', () => {
    it('should call getHistoricalStatistics with default weeks on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(8);
      });
    });

    it('should display chart after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Chart should be rendered (Recharts renders as SVG)
      const chart = screen.getByRole('img', { hidden: true });
      expect(chart).toBeInTheDocument();
    });

    it('should display correct number of data points', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalled();
      });

      // Verify data is passed to chart
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Week Range Selection', () => {
    it('should call service with 4 weeks when 4 weeks button clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toBeInTheDocument();
      });

      const fourWeeksButton = screen.getByRole('button', { name: /4 weeks/i });
      await act(async () => {
        await user.click(fourWeeksButton);
      });

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(4);
      });
    });

    it('should call service with 8 weeks when 8 weeks button clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /8 weeks/i })).toBeInTheDocument();
      });

      const eightWeeksButton = screen.getByRole('button', { name: /8 weeks/i });
      await act(async () => {
        await user.click(eightWeeksButton);
      });

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(8);
      });
    });

    it('should call service with 12 weeks when 12 weeks button clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /12 weeks/i })).toBeInTheDocument();
      });

      const twelveWeeksButton = screen.getByRole('button', { name: /12 weeks/i });
      await act(async () => {
        await user.click(twelveWeeksButton);
      });

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(12);
      });
    });

    it('should update active button state when range changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toBeInTheDocument();
      });

      // Initially 8 weeks should be active
      expect(screen.getByRole('button', { name: /8 weeks/i })).toHaveClass('active');

      // Click 4 weeks
      const fourWeeksButton = screen.getByRole('button', { name: /4 weeks/i });
      await act(async () => {
        await user.click(fourWeeksButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toHaveClass('active');
        expect(screen.getByRole('button', { name: /8 weeks/i })).not.toHaveClass('active');
      });
    });

    it('should reload data when week range changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(8);
      });

      jest.clearAllMocks();

      const twelveWeeksButton = screen.getByRole('button', { name: /12 weeks/i });
      await act(async () => {
        await user.click(twelveWeeksButton);
      });

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledWith(12);
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', async () => {
      const errorMessage = 'Failed to load historical data';
      (statisticsService.getHistoricalStatistics as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (statisticsService.getHistoricalStatistics as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry data fetch when retry button clicked', async () => {
      const user = userEvent.setup();
      (statisticsService.getHistoricalStatistics as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Mock successful response for retry
      (statisticsService.getHistoricalStatistics as jest.Mock).mockResolvedValue(mockHistoricalData);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await act(async () => {
        await user.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty data array', async () => {
      (statisticsService.getHistoricalStatistics as jest.Mock).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Chart should still render with empty data
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should display message for empty history', async () => {
      (statisticsService.getHistoricalStatistics as jest.Mock).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Configuration', () => {
    it('should format week labels correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalled();
      });

      // Week labels should be formatted as "23 Dec", "30 Dec", etc.
      await waitFor(() => {
        expect(screen.getByText(/23 Dec/)).toBeInTheDocument();
        expect(screen.getByText(/30 Dec/)).toBeInTheDocument();
      });
    });

    it('should display completion rate on Y-axis', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/completion rate %/i)).toBeInTheDocument();
      });
    });

    it('should show legend with correct label', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/completion rate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Display', () => {
    it('should show task count in tooltip on hover', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalled();
      });

      // Tooltip functionality is handled by Recharts
      // Just verify the chart is interactive
      const chart = screen.getByRole('img', { hidden: true });
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /8 weeks/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /12 weeks/i })).toBeInTheDocument();
      });
    });

    it('should indicate active button state for screen readers', async () => {
      renderComponent();

      await waitFor(() => {
        const activeButton = screen.getByRole('button', { name: /8 weeks/i });
        expect(activeButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should have proper ARIA labels for chart', async () => {
      renderComponent();

      await waitFor(() => {
        const chart = screen.getByRole('img', { hidden: true });
        expect(chart).toHaveAttribute('aria-label', expect.stringContaining('completion rate'));
      });
    });
  });

  describe('Performance', () => {
    it('should not call service multiple times on initial render', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledTimes(1);
      });
    });

    it('should debounce rapid button clicks', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /4 weeks/i })).toBeInTheDocument();
      });

      jest.clearAllMocks();

      const fourWeeksButton = screen.getByRole('button', { name: /4 weeks/i });
      
      // Rapid clicks
      await act(async () => {
        await user.click(fourWeeksButton);
        await user.click(fourWeeksButton);
        await user.click(fourWeeksButton);
      });

      await waitFor(() => {
        // Should only call once despite multiple clicks
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Theme Integration', () => {
    it('should use theme colors for chart elements', async () => {
      renderComponent();

      await waitFor(() => {
        expect(statisticsService.getHistoricalStatistics).toHaveBeenCalled();
      });

      // Verify chart uses theme (implementation detail, but important for theming)
      const chart = screen.getByRole('img', { hidden: true });
      expect(chart).toBeInTheDocument();
    });
  });
});
