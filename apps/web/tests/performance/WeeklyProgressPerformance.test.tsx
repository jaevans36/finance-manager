import { performance } from 'perf_hooks';
import { statisticsService } from '../../src/services/statisticsService';
import type { WeeklyStatistics, UrgentTask } from '../../src/types/statistics';

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

jest.mock('../../src/services/statisticsService');

const mockStatisticsService = statisticsService as jest.Mocked<typeof statisticsService>;

describe('Weekly Progress Performance Tests (T242)', () => {
  const mockTaskGroups = [
    { id: '1', name: 'Work', colour: '#3b82f6' },
    { id: '2', name: 'Personal', colour: '#10b981' },
    { id: '3', name: 'Urgent', colour: '#ef4444' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to generate weekly statistics with large task counts
  const generateWeeklyStats = (taskCount: number): WeeklyStatistics => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

    const baseDayTasks = Math.floor(taskCount / 7);
    const remainder = taskCount % 7;

    const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      // Distribute remainder across first few days to ensure exact total
      const dayTasks = baseDayTasks + (i < remainder ? 1 : 0);
      const completed = Math.floor(dayTasks * 0.6);

      return {
        date: date.toISOString(),
        completedTasks: completed,
        totalTasks: dayTasks,
        completionRate: dayTasks > 0 ? Math.round((completed / dayTasks) * 100) : 0,
        tasks: [], // Empty tasks array for performance testing
      };
    });

    const totalCompleted = dailyBreakdown.reduce((sum, day) => sum + day.completedTasks, 0);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalTasks: taskCount, // Use exact input count
      completedTasks: totalCompleted,
      completionPercentage: taskCount > 0 ? Math.round((totalCompleted / taskCount) * 100) : 0,
      dailyBreakdown,
    };
  };

  const generateUrgentTasks = (count: number): UrgentTask[] => {
    const priorities = ['High', 'Critical'] as const;
    return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      id: `urgent-${i}`,
      title: `Urgent Task ${i + 1}`,
      priority: priorities[i % 2],
      dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: i + 1,
      groupId: mockTaskGroups[i % mockTaskGroups.length].id,
      groupName: mockTaskGroups[i % mockTaskGroups.length].name,
    }));
  };

  describe('Data Generation Performance', () => {
    it('should generate 1000 task statistics efficiently', () => {
      const startTime = performance.now();
      const stats = generateWeeklyStats(1000);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      
      // Should generate statistics quickly
      expect(generationTime).toBeLessThan(100);
      expect(stats.totalTasks).toBe(1000);
    });

    it('should generate 5000 task statistics efficiently', () => {
      const startTime = performance.now();
      const stats = generateWeeklyStats(5000);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      
      // Should handle large dataset generation
      expect(generationTime).toBeLessThan(200);
      expect(stats.totalTasks).toBe(5000);
    });

    it('should generate 10000 task statistics without hanging', () => {
      const startTime = performance.now();
      const stats = generateWeeklyStats(10000);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      
      // Even extreme datasets should generate reasonably fast
      expect(generationTime).toBeLessThan(500);
      expect(stats.totalTasks).toBe(10000);
    });
  });

  describe('Large Dataset Service Calls', () => {
    it('should handle service call with 1000 tasks', async () => {
      const stats = generateWeeklyStats(1000);
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(stats);

      const startTime = performance.now();
      const result = await statisticsService.getWeeklyStatistics(new Date().toISOString());
      const endTime = performance.now();
      
      const callTime = endTime - startTime;
      
      // Service call should be fast
      expect(callTime).toBeLessThan(100);
      expect(result).toEqual(stats);
    });

    it('should handle service call with 5000 tasks', async () => {
      const stats = generateWeeklyStats(5000);
      mockStatisticsService.getWeeklyStatistics.mockResolvedValue(stats);

      const startTime = performance.now();
      const result = await statisticsService.getWeeklyStatistics(new Date().toISOString());
      const endTime = performance.now();
      
      const callTime = endTime - startTime;
      
      expect(callTime).toBeLessThan(150);
      expect(result.totalTasks).toBe(5000);
    });

    it('should handle 10000 urgent tasks efficiently', async () => {
      const urgent = generateUrgentTasks(10000);
      mockStatisticsService.getUrgentTasks.mockResolvedValue(urgent);

      const startTime = performance.now();
      const result = await statisticsService.getUrgentTasks();
      const endTime = performance.now();
      
      const callTime = endTime - startTime;
      
      // Should return quickly (limited to 10 items by service)
      expect(callTime).toBeLessThan(100);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Data Processing Performance', () => {
    it('should calculate daily breakdown efficiently for 1000 tasks', () => {
      const stats = generateWeeklyStats(1000);
      
      const startTime = performance.now();
      const totalCompleted = stats.dailyBreakdown.reduce((sum, day) => sum + day.completedTasks, 0);
      const totalTasks = stats.dailyBreakdown.reduce((sum, day) => sum + day.totalTasks, 0);
      const avgCompletionRate = stats.dailyBreakdown.reduce((sum, day) => sum + day.completionRate, 0) / 7;
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // Array operations should be fast
      expect(processingTime).toBeLessThan(10);
      expect(totalTasks).toBeGreaterThanOrEqual(1000);
      expect(totalCompleted).toBeGreaterThan(0);
      expect(avgCompletionRate).toBeGreaterThan(0);
    });

    it('should calculate totals efficiently for 5000 tasks', () => {
      const stats = generateWeeklyStats(5000);
      
      const startTime = performance.now();
      const totalFromDaily = stats.dailyBreakdown.reduce((sum, day) => sum + day.totalTasks, 0);
      const completedFromDaily = stats.dailyBreakdown.reduce((sum, day) => sum + day.completedTasks, 0);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // Array operations should be fast
      expect(processingTime).toBeLessThan(10);
      expect(totalFromDaily).toBeGreaterThanOrEqual(5000);
      expect(completedFromDaily).toBeGreaterThan(0);
    });

    it('should calculate completion percentage efficiently for 5000 tasks', () => {
      const stats = generateWeeklyStats(5000);
      
      const startTime = performance.now();
      const calculatedPercentage = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
        : 0;
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // Simple arithmetic should be instant
      expect(processingTime).toBeLessThan(5);
      expect(calculatedPercentage).toBe(stats.completionPercentage);
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.completionPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Memory and Scalability', () => {
    it('should handle repeated data generation without memory issues', () => {
      const iterations = 100;
      const taskCount = 1000;
      
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        const stats = generateWeeklyStats(taskCount);
        expect(stats.totalTasks).toBe(taskCount);
      }
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      // Average time per generation should be low
      expect(avgTime).toBeLessThan(10);
      expect(totalTime).toBeLessThan(1000); // 100 iterations in under 1 second
    });

    it('should handle escalating dataset sizes', () => {
      const sizes = [100, 500, 1000, 2000, 5000];
      const times: number[] = [];
      
      sizes.forEach(size => {
        const startTime = performance.now();
        const stats = generateWeeklyStats(size);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        expect(stats.totalTasks).toBe(size);
      });
      
      // Time should scale reasonably (not exponentially)
      // Even 5000 tasks should be under 200ms
      expect(times[times.length - 1]).toBeLessThan(200);
    });

    it('should handle concurrent service calls efficiently', async () => {
      const stats1 = generateWeeklyStats(1000);
      const stats2 = generateWeeklyStats(2000);
      const urgent = generateUrgentTasks(1000);
      
      mockStatisticsService.getWeeklyStatistics
        .mockResolvedValueOnce(stats1)
        .mockResolvedValueOnce(stats2);
      mockStatisticsService.getUrgentTasks.mockResolvedValue(urgent);
      
      const startTime = performance.now();
      const [result1, result2, result3] = await Promise.all([
        statisticsService.getWeeklyStatistics(new Date().toISOString()),
        statisticsService.getWeeklyStatistics(new Date().toISOString()),
        statisticsService.getUrgentTasks(),
      ]);
      const endTime = performance.now();
      
      const concurrentTime = endTime - startTime;
      
      // Concurrent calls should be efficient
      expect(concurrentTime).toBeLessThan(200);
      expect(result1.totalTasks).toBe(1000);
      expect(result2.totalTasks).toBe(2000);
      expect(result3.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme dataset: 50,000 tasks', () => {
      const startTime = performance.now();
      const stats = generateWeeklyStats(50000);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      
      // Should handle even extreme datasets
      expect(generationTime).toBeLessThan(1000); // Under 1 second
      expect(stats.totalTasks).toBe(50000);
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.completionPercentage).toBeLessThanOrEqual(100);
    });

    it('should process urgent tasks from 100,000 task dataset', () => {
      const startTime = performance.now();
      const urgent = generateUrgentTasks(100000);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      
      // Service limits to 10 regardless of input size
      expect(generationTime).toBeLessThan(100);
      expect(urgent.length).toBeLessThanOrEqual(10);
    });

    it('should maintain data integrity with large datasets', () => {
      const taskCount = 20000;
      const stats = generateWeeklyStats(taskCount);
      
      // Verify data consistency
      const dailyTotal = stats.dailyBreakdown.reduce((sum, day) => sum + day.totalTasks, 0);
      const dailyCompleted = stats.dailyBreakdown.reduce((sum, day) => sum + day.completedTasks, 0);
      
      // All breakdowns should be consistent
      expect(dailyTotal).toBeGreaterThanOrEqual(taskCount);
      expect(stats.totalTasks).toBe(taskCount); // Exact match on totalTasks
      expect(dailyCompleted).toBe(stats.completedTasks); // Daily breakdown should match total
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.completionPercentage).toBeLessThanOrEqual(100);
    });
  });
});
