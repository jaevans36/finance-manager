import { statisticsService } from '../../src/services/statisticsService';
import { taskService } from '../../src/services/taskService';
import { queryCache } from '../../src/utils/queryCache';
import type { WeeklyStatistics, UrgentTask } from '../../src/types/statistics';
import type { Task } from '../../src/services/taskService';

// Mock only the API client, not the services
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

describe('Real-Time Updates (T244)', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      userId: 'user1',
      title: 'Task 1',
      description: null,
      priority: 'High',
      dueDate: new Date().toISOString(),
      completed: false,
      completedAt: null,
      groupId: '1',
      groupName: 'Work',
      groupColour: '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const createMockWeeklyStats = (completedCount: number, totalTasks: number): WeeklyStatistics => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalTasks,
      completedTasks: completedCount,
      completionPercentage: Math.round((completedCount / totalTasks) * 100),
      dailyBreakdown: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          totalTasks: Math.floor(totalTasks / 7),
          completedTasks: Math.floor(completedCount / 7),
          completionRate: Math.round((completedCount / totalTasks) * 100),
          tasks: [],
        };
      }),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryCache.clear();
  });

  describe('Cache Invalidation on Task Updates', () => {
    it('should invalidate cache when task is toggled', async () => {
      const updatedTask = { ...mockTasks[0], completed: true };
      mockApiClient.put.mockResolvedValue({ data: updatedTask });

      // Populate cache
      const cacheKey = 'weekly-stats-current';
      queryCache.set(cacheKey, createMockWeeklyStats(5, 10));

      // Verify cache has data
      expect(queryCache.get(cacheKey)).not.toBeNull();

      // Toggle task (which should invalidate cache)
      await taskService.toggleTask('1', true);

      // Verify cache was invalidated
      expect(queryCache.get(cacheKey)).toBeNull();
    });

    it('should invalidate cache when task is created', async () => {
      const newTask = mockTasks[0];
      mockApiClient.post.mockResolvedValue({ data: newTask });

      // Populate cache
      queryCache.set('weekly-stats-current', createMockWeeklyStats(5, 10));
      queryCache.set('daily-stats-current', createMockWeeklyStats(5, 10));

      // Create task
      await taskService.createTask({ title: 'New Task', priority: 'High' });

      // Verify caches were invalidated
      expect(queryCache.get('weekly-stats-current')).toBeNull();
      expect(queryCache.get('daily-stats-current')).toBeNull();
    });

    it('should invalidate cache when task is updated', async () => {
      const updatedTask = { ...mockTasks[0], title: 'Updated Task' };
      mockApiClient.put.mockResolvedValue({ data: updatedTask });

      queryCache.set('weekly-stats-current', createMockWeeklyStats(5, 10));

      await taskService.updateTask('1', { title: 'Updated Task' });

      expect(queryCache.get('weekly-stats-current')).toBeNull();
    });

    it('should invalidate cache when task is deleted', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      queryCache.set('weekly-stats-current', createMockWeeklyStats(5, 10));

      await taskService.deleteTask('1');

      expect(queryCache.get('weekly-stats-current')).toBeNull();
    });
  });

  describe('Fresh Data After Task Modifications', () => {
    it('should fetch fresh statistics after task completion', async () => {
      const initialStats = createMockWeeklyStats(5, 10);
      const updatedStats = createMockWeeklyStats(6, 10);

      mockApiClient.get
        .mockResolvedValueOnce({ data: initialStats })
        .mockResolvedValueOnce({ data: updatedStats });

      // First fetch - populates cache
      const stats1 = await statisticsService.getWeeklyStatistics();
      expect(stats1.completedTasks).toBe(5);

      // Simulate task completion (invalidates cache)
      statisticsService.invalidateCache();

      // Second fetch should get fresh data from API
      const stats2 = await statisticsService.getWeeklyStatistics();
      expect(stats2.completedTasks).toBe(6);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should reflect task completion in completion percentage', async () => {
      const before = createMockWeeklyStats(5, 10); // 50%
      const after = createMockWeeklyStats(7, 10);   // 70%

      mockApiClient.get
        .mockResolvedValueOnce({ data: before })
        .mockResolvedValueOnce({ data: after });

      const statsBefore = await statisticsService.getWeeklyStatistics();
      expect(statsBefore.completionPercentage).toBe(50);

      statisticsService.invalidateCache();

      const statsAfter = await statisticsService.getWeeklyStatistics();
      expect(statsAfter.completionPercentage).toBe(70);
    });

    it('should update urgent tasks list after task completion', async () => {
      const initialUrgent: UrgentTask[] = [
        { id: '1', title: 'Urgent 1', priority: 'High', daysUntilDue: 1 },
        { id: '2', title: 'Urgent 2', priority: 'Critical', daysUntilDue: 0 },
      ];

      const updatedUrgent: UrgentTask[] = [
        { id: '2', title: 'Urgent 2', priority: 'Critical', daysUntilDue: 0 },
      ];

      mockApiClient.get
        .mockResolvedValueOnce({ data: initialUrgent })
        .mockResolvedValueOnce({ data: updatedUrgent });

      const urgentBefore = await statisticsService.getUrgentTasks();
      expect(urgentBefore).toHaveLength(2);

      statisticsService.invalidateCache();

      const urgentAfter = await statisticsService.getUrgentTasks();
      expect(urgentAfter).toHaveLength(1);
      expect(urgentAfter[0].id).toBe('2');
    });
  });

  describe('Cache Behaviour with Multiple Updates', () => {
    it('should handle rapid successive task updates', async () => {
      const stats = [
        createMockWeeklyStats(5, 10),
        createMockWeeklyStats(6, 10),
        createMockWeeklyStats(7, 10),
      ];

      mockApiClient.get
        .mockResolvedValueOnce({ data: stats[0] })
        .mockResolvedValueOnce({ data: stats[1] })
        .mockResolvedValueOnce({ data: stats[2] });

      // Multiple rapid updates
      const result1 = await statisticsService.getWeeklyStatistics();
      expect(result1.completedTasks).toBe(5);

      statisticsService.invalidateCache();
      const result2 = await statisticsService.getWeeklyStatistics();
      expect(result2.completedTasks).toBe(6);

      statisticsService.invalidateCache();
      const result3 = await statisticsService.getWeeklyStatistics();
      expect(result3.completedTasks).toBe(7);
    });

    it('should maintain cache for different week parameters', async () => {
      const week1Stats = createMockWeeklyStats(5, 10);
      const week2Stats = createMockWeeklyStats(8, 12);

      mockApiClient.get
        .mockResolvedValueOnce({ data: week1Stats })
        .mockResolvedValueOnce({ data: week2Stats });

      await statisticsService.getWeeklyStatistics('2024-01-01');
      await statisticsService.getWeeklyStatistics('2024-01-08');

      // Invalidate should clear both
      statisticsService.invalidateCache();

      const stats = queryCache.getStats();
      expect(stats.keys.filter(k => k.startsWith('weekly-stats-'))).toHaveLength(0);
    });
  });

  describe('Integration: Task Toggle Workflow', () => {
    it('should complete full workflow: toggle task → invalidate cache → fetch fresh stats', async () => {
      const beforeStats = createMockWeeklyStats(5, 10);
      const afterStats = createMockWeeklyStats(6, 10);
      const updatedTask = { ...mockTasks[0], completed: true };

      // Setup: Initial statistics
      mockApiClient.get.mockResolvedValueOnce({ data: beforeStats });
      const initialStats = await statisticsService.getWeeklyStatistics();
      expect(initialStats.completedTasks).toBe(5);

      // Action: Toggle task
      mockApiClient.put.mockResolvedValue({ data: updatedTask });
      await taskService.toggleTask('1', true);

      // Verify: Cache was cleared (no key exists for weekly stats)
      const stats = queryCache.getStats();
      expect(stats.keys.filter(k => k.startsWith('weekly-stats-'))).toHaveLength(0);

      // Verify: Fresh data on next fetch
      mockApiClient.get.mockResolvedValueOnce({ data: afterStats });
      const newStats = await statisticsService.getWeeklyStatistics();
      expect(newStats.completedTasks).toBe(6);
    });

    it('should handle task untoggle (mark incomplete)', async () => {
      const beforeStats = createMockWeeklyStats(6, 10);
      const afterStats = createMockWeeklyStats(5, 10);
      const updatedTask = { ...mockTasks[0], completed: false };

      mockApiClient.get.mockResolvedValueOnce({ data: beforeStats });
      await statisticsService.getWeeklyStatistics();

      mockApiClient.put.mockResolvedValue({ data: updatedTask });
      await taskService.toggleTask('1', false);

      // Verify cache was invalidated
      const cacheStats = queryCache.getStats();
      expect(cacheStats.keys.filter(k => k.startsWith('weekly-stats-'))).toHaveLength(0);

      mockApiClient.get.mockResolvedValueOnce({ data: afterStats });
      const newStats = await statisticsService.getWeeklyStatistics();
      expect(newStats.completedTasks).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle task toggle failure gracefully', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Network error'));

      await expect(taskService.toggleTask('1', true)).rejects.toThrow('Network error');
    });

    it('should handle statistics fetch failure after invalidation', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API error'));

      statisticsService.invalidateCache();

      await expect(statisticsService.getWeeklyStatistics()).rejects.toThrow('API error');
    });
  });
});
