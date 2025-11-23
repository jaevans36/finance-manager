import { apiClient } from './api-client';

interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
    });
    return response.data.data!;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/password-reset/request', {
      email,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/password-reset/reset', {
      token,
      newPassword,
    });
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const response = await apiClient.get<ApiResponse<{ valid: boolean; email?: string }>>(
      `/auth/password-reset/verify/${token}`
    );
    return response.data.data!;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/email-verification/verify', {
      token,
    });
  },

  async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/email-verification/resend', {
      email,
    });
  },
};
