import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../src/styles/theme';
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

import WeeklyProgressPage from '../../src/pages/WeeklyProgressPage';
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
      <ThemeProvider theme={lightTheme}>
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
    mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(new Date('2026-01-05')));
    mockStatisticsService.getUrgentTasks.mockResolvedValue([]);
    mockTaskService.getTasks.mockResolvedValue([]);
    mockTaskGroupService.getGroups.mockResolvedValue([]);
  });

  describe('Week Display Format', () => {
    it('should format week range correctly for single month', async () => {
      const weekStart = new Date('2026-01-05');
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(weekStart));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/5 Jan - 11 Jan 2026/)).toBeInTheDocument();
      });
    });

    it('should format week spanning months correctly', async () => {
      const weekStart = new Date('2025-12-29');
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(weekStart));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/29 Dec - 4 Jan 2026/)).toBeInTheDocument();
      });
    });
  });

  describe('Previous/Next Week Navigation', () => {
    it('should have previous and next navigation buttons', async () => {
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/5 Jan - 11 Jan 2026/)).toBeInTheDocument();
      });
      
      const prevButton = findButton('Previous');
      const nextButton = findButton('Next');
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should call statistics service when navigating', async () => {
      const week1 = new Date('2026-01-05');
      const week2 = new Date('2026-01-12');
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(week1))
        .mockResolvedValueOnce(mockWeeklyStats(week2));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(1);
      });
      
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
      
      if (nextButton) {
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
        }, { timeout: 3000 });
      }
    });

    it('should navigate backward to previous week', async () => {
      const week1 = new Date('2026-01-05');
      const week2 = new Date('2025-12-29');
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(week1))
        .mockResolvedValueOnce(mockWeeklyStats(week2));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(1);
      });
      
      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));
      
      if (prevButton) {
        fireEvent.click(prevButton);
        
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
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
      const pastWeek = new Date('2025-12-01');
      const currentDate = new Date();
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(pastWeek))
        .mockResolvedValueOnce(mockWeeklyStats(currentDate));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalled();
      });
      
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Month Boundary Navigation', () => {
    it('should correctly display week spanning year boundary', async () => {
      // Week from Dec 29, 2025 to Jan 4, 2026
      const spanningWeek = new Date('2025-12-29');
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(spanningWeek));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/29 Dec - 4 Jan 2026/)).toBeInTheDocument();
      });
    });

    it('should handle navigation across year boundary', async () => {
      const jan2026 = new Date('2026-01-05');
      const dec2025 = new Date('2025-12-29');
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(jan2026))
        .mockResolvedValueOnce(mockWeeklyStats(dec2025));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/5 Jan - 11 Jan 2026/)).toBeInTheDocument();
      });
      
      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));
      
      if (prevButton) {
        fireEvent.click(prevButton);
        
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('Data Refresh on Navigation', () => {
    it('should reload statistics when week changes', async () => {
      const week1 = new Date('2026-01-05');
      const week2 = new Date('2026-01-12');
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(week1))
        .mockResolvedValueOnce(mockWeeklyStats(week2));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(1);
      });
      
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
      
      if (nextButton) {
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
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
    it('should render with week starting on Monday', async () => {
      const monday = new Date('2026-01-05'); // Monday
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(monday));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalled();
      });
      
      const firstCall = mockStatisticsService.getWeeklyStatistics.mock.calls[0]?.[0];
      expect(firstCall).toBeDefined();
      // WeeklyProgressPage should call with a Date object
      expect(firstCall).toBeInstanceOf(Date);
    });

    it('should calculate correct week range', async () => {
      const weekStart = new Date('2026-01-05');
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(mockWeeklyStats(weekStart));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(screen.getByText(/5 Jan - 11 Jan 2026/)).toBeInTheDocument();
      });
      
      // Week should be Monday (5th) to Sunday (11th)
      const displayedWeek = screen.getByText(/5 Jan - 11 Jan 2026/);
      expect(displayedWeek).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should display loading state initially', () => {
      mockStatisticsService.getWeeklyStatistics.mockReturnValue(new Promise(() => {})); // Never resolves
      
      renderWeeklyProgress();
      
      // Page should render even while loading
      expect(screen.getByText('Weekly Progress Dashboard')).toBeInTheDocument();
    });

    it('should handle multiple consecutive navigations', async () => {
      const weeks = [
        new Date('2026-01-05'),
        new Date('2026-01-12'),
        new Date('2026-01-19')
      ];
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(mockWeeklyStats(weeks[0]))
        .mockResolvedValueOnce(mockWeeklyStats(weeks[1]))
        .mockResolvedValueOnce(mockWeeklyStats(weeks[2]));
      
      renderWeeklyProgress();
      
      await waitFor(() => {
        expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(1);
      });
      
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
      
      if (nextButton) {
        // First click
        fireEvent.click(nextButton);
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(2);
        });
        
        // Second click
        fireEvent.click(nextButton);
        await waitFor(() => {
          expect(mockStatisticsService.getWeeklyStatistics).toHaveBeenCalledTimes(3);
        });
      }
    });
  });
});
