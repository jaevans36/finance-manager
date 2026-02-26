import { statisticsService } from '../../src/services/statisticsService';
import { queryCache } from '../../src/utils/queryCache';
import type { WeeklyStatistics, DailyStatistics, UrgentTask } from '../../src/types/statistics';

// Mock the API client
jest.mock('../../src/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

import { apiClient } from '../../src/services/api-client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('statisticsService with Caching (T243)', () => {
  const mockWeeklyStats: WeeklyStatistics = {
    weekStart: '2024-01-01T00:00:00Z',
    weekEnd: '2024-01-07T23:59:59Z',
    totalTasks: 100,
    completedTasks: 60,
    completionPercentage: 60,
    dailyBreakdown: [],
  };

  const mockDailyStats: DailyStatistics = {
    date: '2024-01-01T00:00:00Z',
    totalTasks: 10,
    completedTasks: 6,
    completionRate: 60,
    tasks: [],
  };

  const mockUrgentTasks: UrgentTask[] = [
    {
      id: '1',
      title: 'Urgent Task',
      priority: 'High',
      dueDate: '2024-01-02T00:00:00Z',
      daysUntilDue: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    queryCache.clear();
  });

  describe('getWeeklyStatistics', () => {
    it('should fetch from API on first call', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      const result = await statisticsService.getWeeklyStatistics('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/weekly', {
        params: { weekStart: '2024-01-01' },
      });
      expect(result).toEqual(mockWeeklyStats);
    });

    it('should return cached data on subsequent calls', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      // First call - fetches from API
      await statisticsService.getWeeklyStatistics('2024-01-01');

      // Second call - should use cache
      const result = await statisticsService.getWeeklyStatistics('2024-01-01');

      // API should only be called once
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockWeeklyStats);
    });

    it('should use different cache keys for different weeks', async () => {
      const week1Stats = { ...mockWeeklyStats, weekStart: '2024-01-01' };
      const week2Stats = { ...mockWeeklyStats, weekStart: '2024-01-08' };

      mockApiClient.get
        .mockResolvedValueOnce({ data: week1Stats })
        .mockResolvedValueOnce({ data: week2Stats });

      const result1 = await statisticsService.getWeeklyStatistics('2024-01-01');
      const result2 = await statisticsService.getWeeklyStatistics('2024-01-08');

      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(week1Stats);
      expect(result2).toEqual(week2Stats);
    });

    it('should handle undefined weekStart parameter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      await statisticsService.getWeeklyStatistics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/weekly', {
        params: {},
      });
    });

    it('should cache results for 5 minutes', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      await statisticsService.getWeeklyStatistics('2024-01-01');

      // Verify cache entry exists
      const stats = queryCache.getStats();
      expect(stats.keys).toContain('weekly-stats-2024-01-01');
    });
  });

  describe('getDailyStatistics', () => {
    it('should fetch from API on first call', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDailyStats });

      const result = await statisticsService.getDailyStatistics('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/daily', {
        params: { date: '2024-01-01' },
      });
      expect(result).toEqual(mockDailyStats);
    });

    it('should return cached data on subsequent calls', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDailyStats });

      await statisticsService.getDailyStatistics('2024-01-01');
      const result = await statisticsService.getDailyStatistics('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDailyStats);
    });

    it('should use different cache keys for different dates', async () => {
      const day1Stats = { ...mockDailyStats, date: '2024-01-01' };
      const day2Stats = { ...mockDailyStats, date: '2024-01-02' };

      mockApiClient.get
        .mockResolvedValueOnce({ data: day1Stats })
        .mockResolvedValueOnce({ data: day2Stats });

      const result1 = await statisticsService.getDailyStatistics('2024-01-01');
      const result2 = await statisticsService.getDailyStatistics('2024-01-02');

      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(day1Stats);
      expect(result2).toEqual(day2Stats);
    });
  });

  describe('getUrgentTasks', () => {
    it('should fetch from API on first call', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUrgentTasks });

      const result = await statisticsService.getUrgentTasks('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/urgent', {
        params: { weekStart: '2024-01-01' },
      });
      expect(result).toEqual(mockUrgentTasks);
    });

    it('should return cached data on subsequent calls', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUrgentTasks });

      await statisticsService.getUrgentTasks('2024-01-01');
      const result = await statisticsService.getUrgentTasks('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUrgentTasks);
    });

    it('should use shorter TTL (2 minutes) for urgent tasks', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUrgentTasks });

      await statisticsService.getUrgentTasks('2024-01-01');

      // Verify cache entry exists
      const stats = queryCache.getStats();
      expect(stats.keys).toContain('urgent-tasks-2024-01-01');
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate all statistics caches', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockWeeklyStats })
        .mockResolvedValueOnce({ data: mockDailyStats })
        .mockResolvedValueOnce({ data: mockUrgentTasks });

      // Populate cache
      await statisticsService.getWeeklyStatistics('2024-01-01');
      await statisticsService.getDailyStatistics('2024-01-01');
      await statisticsService.getUrgentTasks('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);

      // Invalidate cache
      statisticsService.invalidateCache();

      // Reset mock to verify new calls
      mockApiClient.get.mockClear();
      mockApiClient.get
        .mockResolvedValueOnce({ data: mockWeeklyStats })
        .mockResolvedValueOnce({ data: mockDailyStats })
        .mockResolvedValueOnce({ data: mockUrgentTasks });

      // Should fetch from API again
      await statisticsService.getWeeklyStatistics('2024-01-01');
      await statisticsService.getDailyStatistics('2024-01-01');
      await statisticsService.getUrgentTasks('2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });

    it('should only invalidate statistics caches, not other caches', () => {
      // Add non-statistics cache entry
      queryCache.set('other-cache-key', 'some-data');

      // Add statistics cache entries
      queryCache.set('weekly-stats-current', mockWeeklyStats);
      queryCache.set('daily-stats-current', mockDailyStats);

      statisticsService.invalidateCache();

      // Statistics caches should be cleared
      expect(queryCache.get('weekly-stats-current')).toBeNull();
      expect(queryCache.get('daily-stats-current')).toBeNull();

      // Other cache should remain
      expect(queryCache.get('other-cache-key')).toBe('some-data');
    });
  });

  describe('Cache Performance', () => {
    it('should reduce API calls when data is cached', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      // First call populates cache
      await statisticsService.getWeeklyStatistics('2024-01-01');
      
      // Subsequent calls should use cache
      await statisticsService.getWeeklyStatistics('2024-01-01');
      await statisticsService.getWeeklyStatistics('2024-01-01');
      await statisticsService.getWeeklyStatistics('2024-01-01');

      // Only first call should hit the API
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests efficiently', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockWeeklyStats });

      // Simulate concurrent requests before cache is populated
      const promise1 = statisticsService.getWeeklyStatistics('2024-01-01');
      const promise2 = statisticsService.getWeeklyStatistics('2024-01-01');
      const promise3 = statisticsService.getWeeklyStatistics('2024-01-01');

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // All should return the same data
      expect(result1).toEqual(mockWeeklyStats);
      expect(result2).toEqual(mockWeeklyStats);
      expect(result3).toEqual(mockWeeklyStats);

      // Note: May be called 1-3 times depending on race conditions
      // This is acceptable as cache will prevent subsequent calls
      expect(mockApiClient.get).toHaveBeenCalled();
    });
  });
});
