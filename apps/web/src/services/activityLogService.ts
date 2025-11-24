import { apiClient } from './api-client';

interface ActivityLog {
  id: string;
  action: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export const activityLogService = {
  async getActivityLogs(page = 1, limit = 20): Promise<ActivityLogResponse> {
    const response = await apiClient.get<ActivityLogResponse>('/activity-logs', {
      params: { page, limit },
    });
    return response.data;
  },
};
