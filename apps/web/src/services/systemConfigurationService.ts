import { apiClient, getFullApiUrl } from './api-client';

export interface RateLimitConfiguration {
  enabled: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
}

export interface SystemConfiguration {
  environment: string;
  rateLimit: RateLimitConfiguration;
}

class SystemConfigurationService {
  async getConfiguration(): Promise<SystemConfiguration> {
    const response = await apiClient.get<SystemConfiguration>(
      getFullApiUrl('/api/admin/configuration')
    );
    return response.data;
  }
}

export const systemConfigurationService = new SystemConfigurationService();
