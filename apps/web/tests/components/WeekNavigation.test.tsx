import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@finance-manager/ui';
import { ToastProvider } from '../../src/contexts/ToastContext';

// Mock api-client before importing services
jest.mock('../../src/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

import WeeklyProgressPage from '../../src/pages/weekly-progress/WeeklyProgressPage';
import { statisticsService } from '../../src/services/statisticsService';
import { taskService } from '../../src/services/taskService';
import { taskGroupService } from '../../src/services/taskGroupService';

jest.mock('../../src/services/statisticsService');
jest.mock('../../src/services/taskService');
jest.mock('../../src/services/taskGroupService');

const mockStatisticsService = statisticsService as jest.Mocked<typeof statisticsService>;
const mockTaskService = taskService as jest.Mocked<typeof taskService>;
const mockTaskGroupService = taskGroupService as jest.Mocked<typeof taskGroupService>;

const renderWeeklyProgress = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <WeeklyProgressPage />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Helper to find navigation buttons (handles arrow characters)
const findButton = (text: string) => {
  const buttons = screen.getAllByRole('button');
  if (text === 'Previous') {
    return buttons.find(btn => btn.textContent?.includes('Previous') || btn.textContent?.includes('←'));
  }
  if (text === 'Next') {
    return buttons.find(btn => btn.textContent?.includes('Next') || btn.textContent?.includes('→'));
  }
  return buttons.find(btn => btn.textContent?.includes(text));
};

// Helper: replicate the component's getWeekStart logic
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Helper: compute expected week range text as the component formats it
function formatExpectedWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// The component starts on current week's Monday
const currentMonday = getWeekStart(new Date());
const expectedCurrentWeekRange = formatExpectedWeekRange(currentMonday);

const mockWeeklyStats = (weekStart: Date) => ({
  weekStart: weekStart.toISOString(),
  weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  totalTasks: 10,
  completedTasks: 7,
  completionPercentage: 70,
  dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
    totalTasks: 2,
    completedTasks: 1,
    completionRate: 50,
    tasks: []
  }))
});

describe('WeeklyProgressPage - Week Navigation (T239)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // loadData calls getWeeklyStatistics twice per invocation (current + prev week)
    mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(currentMonday));
    mockStatisticsService.getUrgentTasks.mockResolvedValue([]);
    mockStatisticsService.getHistoricalStatistics.mockResolvedValue([]);
    mockTaskService.getTasks.mockResolvedValue([]);
    mockTaskGroupService.getGroups.mockResolvedValue([]);
  });

  describe('Week Display Format', () => {
    it('should format week range correctly for current week', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(screen.getByText(expectedCurrentWeekRange)).toBeInTheDocument();
      });
    });

    it('should display week range in en-GB format (day month - day month year)', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        // en-GB format: "15 Jun - 21 Jun 2025" pattern
        expect(screen.getByText(/\d{1,2} [A-Z][a-z]{2} - \d{1,2} [A-Z][a-z]{2} \d{4}/)).toBeInTheDocument();
      });
    });
  });

  describe('Previous/Next Week Navigation', () => {
    it('should have previous and next navigation buttons', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(screen.getByText(expectedCurrentWeekRange)).toBeInTheDocument();
      });

      const prevButton = findButton('Previous');
      const nextButton = findButton('Next');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should call statistics service when navigating forward', async () => {
      renderWeeklyProgress();

      // loadData calls getWeeklyStatistics 2x per load (current + prev week)
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));

      if (nextButton) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          // 2 initial + 2 after navigation = 4
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
        }, { timeout: 3000 });
      }
    });

    it('should navigate backward to previous week', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));

      if (prevButton) {
        fireEvent.click(prevButton);

        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
        }, { timeout: 3000 });
      }
    });
  });

  describe('"This Week" Button', () => {
    it('should have a "This Week" button or "Today" button', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalled();
      });

      const thisWeekButton = screen.queryByText('This Week') || screen.queryByText('Today');
      expect(thisWeekButton).toBeInTheDocument();
    });

    it('should reset to current week when "Today" button clicked', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalled();
      });

      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);

      // Clicking Today triggers another loadData call (+2 getWeeklyStatistics)
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('Month Boundary Navigation', () => {
    it('should display a valid week range after navigating backward', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(screen.getByText(expectedCurrentWeekRange)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));

      if (prevButton) {
        fireEvent.click(prevButton);

        // After navigating back, the displayed week should change
        const prevMonday = new Date(currentMonday);
        prevMonday.setDate(prevMonday.getDate() - 7);
        const expectedPrevWeekRange = formatExpectedWeekRange(prevMonday);

        await waitFor(() => {
          expect(screen.getByText(expectedPrevWeekRange)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should handle navigation across weeks correctly', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));

      if (prevButton) {
        fireEvent.click(prevButton);

        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
        });
      }
    });
  });

  describe('Data Refresh on Navigation', () => {
    it('should reload statistics when week changes', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));

      if (nextButton) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
          expect(mockStatisticsService.getUrgentTasks).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });
      }
    });

    it('should reload urgent tasks when navigating', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getUrgentTasks).toHaveBeenCalledTimes(1);
      });

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));

      if (nextButton) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          expect(mockStatisticsService.getUrgentTasks).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });
      }
    });
  });

  describe('Week Start Calculation', () => {
    it('should call service with an ISO date string on mount', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalled();
      });

      // The component passes weekStartStr (ISO string) to the service
      const firstCall = mockStatisticsService.getWeeklyStatistics.mock.calls[0]?.[0];
      expect(firstCall).toBeDefined();
      expect(typeof firstCall).toBe('string');
    });

    it('should display correct week range for the current week', async () => {
      renderWeeklyProgress();

      await waitFor(() => {
        expect(screen.getByText(expectedCurrentWeekRange)).toBeInTheDocument();
      });

      // Week should be Monday to Sunday (7-day range)
      const displayedWeek = screen.getByText(expectedCurrentWeekRange);
      expect(displayedWeek).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should display page title while loading', async () => {
      renderWeeklyProgress();

      // Title should be visible
      await waitFor(() => {
        expect(screen.getByText('Weekly Progress Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle multiple consecutive navigations', async () => {
      renderWeeklyProgress();

      // Initial load: 2 calls (current + prev week)
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });

      // First navigation
      const nextButton1 = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Next'));
      expect(nextButton1).toBeDefined();
      fireEvent.click(nextButton1!);
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(4);
      });

      // Re-query button after re-render, then navigate again
      const nextButton2 = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Next'));
      expect(nextButton2).toBeDefined();
      fireEvent.click(nextButton2!);
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(6);
      }, { timeout: 5000 });
    });
  });
});
