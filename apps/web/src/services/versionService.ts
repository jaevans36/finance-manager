/**
 * Version Service
 * 
 * API client for version history and release information.
 * Provides methods to fetch current version, version history, and specific versions.
 * 
 * @module services/versionService
 */

import { apiClient, getFullApiUrl } from './api-client';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  codename: string;
  description?: string;
  breaking?: boolean;
  changelog: ChangelogEntry[];
}

export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'perf' | 'docs' | 'test';
  category: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
}

export interface VersionHistory {
  versions: VersionHistoryItem[];
  totalVersions: number;
  earliestVersion: string | null;
  latestVersion: string | null;
}

export interface VersionHistoryItem {
  version: string;
  releaseDate: string;
  codename: string;
  changelog: ChangelogSection[];
}

export interface ChangelogSection {
  section: string; // Added, Changed, Fixed, etc.
  items: ChangelogItem[];
}

export interface ChangelogItem {
  category: string;
  description: string;
  type: string;
}

/**
 * Version Service
 * Provides methods for fetching version and changelog information
 */
export const versionService = {
  /**
   * Get current version information from VERSION.json
   */
  getCurrentVersion: async (): Promise<VersionInfo> => {
    const { data } = await apiClient.get<VersionInfo>(getFullApiUrl('/api/version/current'));
    return data;
  },

  /**
   * Get all version history from CHANGELOG.md
   */
  getVersionHistory: async (): Promise<VersionHistory> => {
    const { data } = await apiClient.get<VersionHistory>(getFullApiUrl('/api/version/history'));
    return data;
  },

  /**
   * Get specific version by number
   * @param version - Version number (e.g., "0.14.0")
   */
  getVersionByNumber: async (version: string): Promise<VersionHistoryItem> => {
    const { data} = await apiClient.get<VersionHistoryItem>(getFullApiUrl(`/api/version/history/${version}`));
    return data;
  }
};
