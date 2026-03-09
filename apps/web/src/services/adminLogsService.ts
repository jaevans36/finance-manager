import { apiClient, getFullApiUrl } from './api-client';

export interface LogEntry {
  timestamp: string;
  level: 'INF' | 'WRN' | 'ERR' | 'FTL' | string;
  message: string;
}

class AdminLogsService {
  private readonly baseUrl = '/api/admin/logs';

  async getLogs(lines: number = 200, level: string = 'all'): Promise<LogEntry[]> {
    const params = new URLSearchParams({ lines: String(lines), level });
    const response = await apiClient.get<LogEntry[]>(
      getFullApiUrl(`${this.baseUrl}?${params.toString()}`)
    );
    return response.data;
  }
}

export const adminLogsService = new AdminLogsService();
