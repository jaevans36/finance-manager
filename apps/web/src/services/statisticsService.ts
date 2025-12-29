import { apiClient } from './api-client';
import type { WeeklyStatistics, DailyStatistics, UrgentTask } from '../types/statistics';

export const statisticsService = {
  async getWeeklyStatistics(weekStart?: string): Promise<WeeklyStatistics> {
    const params = weekStart ? { weekStart } : {};
    const response = await apiClient.get<WeeklyStatistics>('/statistics/weekly', { params });
    return response.data;
  },

  async getDailyStatistics(date?: string): Promise<DailyStatistics> {
    const params = date ? { date } : {};
    const response = await apiClient.get<DailyStatistics>('/statistics/daily', { params });
    return response.data;
  },

  async getUrgentTasks(weekStart?: string): Promise<UrgentTask[]> {
    const params = weekStart ? { weekStart } : {};
    const response = await apiClient.get<UrgentTask[]>('/statistics/urgent', { params });
    return response.data;
  },
};
