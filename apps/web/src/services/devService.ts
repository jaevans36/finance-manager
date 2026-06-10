import { apiClient } from './api-client';

export const devService = {
  async resetPassword(email: string, newPassword: string): Promise<void> {
    await apiClient.post('/dev/reset-password', { email, newPassword });
  },
};
