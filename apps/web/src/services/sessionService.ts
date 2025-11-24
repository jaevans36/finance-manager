import { apiClient } from './api-client';

interface Session {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export const sessionService = {
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions');
    return response.data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}`);
  },

  async revokeAllSessions(): Promise<void> {
    await apiClient.delete('/sessions');
  },
};
