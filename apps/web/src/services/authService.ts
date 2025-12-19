import { apiClient } from './api-client';

interface User {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface CheckUsernameResponse {
  available: boolean;
  message: string;
}

export const authService = {
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      emailOrUsername,
      password,
    });
    return response.data;
  },

  async checkUsername(username: string): Promise<CheckUsernameResponse> {
    const response = await apiClient.post<CheckUsernameResponse>('/auth/check-username', {
      username,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request', {
      email,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/reset', {
      token,
      newPassword,
    });
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const response = await apiClient.get<{ valid: boolean; email?: string }>(
      `/auth/password-reset/verify/${token}`
    );
    return response.data;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/email-verification/verify', {
      token,
    });
  },

  async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post('/auth/email-verification/resend', {
      email,
    });
  },
};
