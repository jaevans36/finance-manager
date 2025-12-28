import axios from 'axios';
import type { WeeklyStatistics, DailyStatistics, UrgentTask } from '../types/statistics';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const statisticsService = {
  async getWeeklyStatistics(weekStart?: string): Promise<WeeklyStatistics> {
    const params = weekStart ? { weekStart } : {};
    const response = await axios.get(`${API_URL}/statistics/weekly`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },

  async getDailyStatistics(date?: string): Promise<DailyStatistics> {
    const params = date ? { date } : {};
    const response = await axios.get(`${API_URL}/statistics/daily`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },

  async getUrgentTasks(weekStart?: string): Promise<UrgentTask[]> {
    const params = weekStart ? { weekStart } : {};
    const response = await axios.get(`${API_URL}/statistics/urgent`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },
};
