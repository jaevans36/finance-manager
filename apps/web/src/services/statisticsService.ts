import { apiClient } from './api-client';
import type { WeeklyStatistics, DailyStatistics, UrgentTask } from '../types/statistics';
import { queryCache } from '../utils/queryCache';

export const statisticsService = {
  async getWeeklyStatistics(weekStart?: string): Promise<WeeklyStatistics> {
    const cacheKey = `weekly-stats-${weekStart || 'current'}`;
    
    // Check cache first
    const cached = queryCache.get<WeeklyStatistics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const params = weekStart ? { weekStart } : {};
    const response = await apiClient.get<WeeklyStatistics>('/statistics/weekly', { params });
    
    // Cache the result (5 minutes TTL)
    queryCache.set(cacheKey, response.data, 5 * 60 * 1000);
    
    return response.data;
  },

  async getDailyStatistics(date?: string): Promise<DailyStatistics> {
    const cacheKey = `daily-stats-${date || 'current'}`;
    
    // Check cache first
    const cached = queryCache.get<DailyStatistics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const params = date ? { date } : {};
    const response = await apiClient.get<DailyStatistics>('/statistics/daily', { params });
    
    // Cache the result (5 minutes TTL)
    queryCache.set(cacheKey, response.data, 5 * 60 * 1000);
    
    return response.data;
  },

  async getUrgentTasks(weekStart?: string): Promise<UrgentTask[]> {
    const cacheKey = `urgent-tasks-${weekStart || 'current'}`;
    
    // Check cache first
    const cached = queryCache.get<UrgentTask[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const params = weekStart ? { weekStart } : {};
    const response = await apiClient.get<UrgentTask[]>('/statistics/urgent', { params });
    
    // Cache the result (2 minutes TTL - shorter for urgent tasks)
    queryCache.set(cacheKey, response.data, 2 * 60 * 1000);
    
    return response.data;
  },

  /**
   * Invalidate all statistics caches
   * Call this when tasks are updated to ensure fresh data
   */
  invalidateCache(): void {
    queryCache.invalidatePattern(/^(weekly-stats|daily-stats|urgent-tasks)-/);
  },
};
