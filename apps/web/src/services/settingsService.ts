import { apiClient } from './api-client';

export interface UserSettings {
  id: string;
  globalWipLimit: number | null;
  defaultTaskStatus: string;
  enableWipWarnings: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsInput {
  globalWipLimit?: number | null;
  defaultTaskStatus?: string;
  enableWipWarnings?: boolean;
}

export interface WipSummary {
  inProgressCount: number;
  globalWipLimit: number | null;
  isOverLimit: boolean;
  groups: GroupWipSummary[];
}

export interface GroupWipSummary {
  groupId: string;
  groupName: string;
  groupColour: string;
  inProgressCount: number;
  wipLimit: number | null;
  isOverLimit: boolean;
}

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<UserSettings>('/settings');
    return response.data;
  },

  async updateSettings(input: UpdateUserSettingsInput): Promise<UserSettings> {
    const response = await apiClient.put<UserSettings>('/settings', input);
    return response.data;
  },

  async getWipSummary(): Promise<WipSummary> {
    const response = await apiClient.get<WipSummary>('/settings/wip-summary');
    return response.data;
  },
};
