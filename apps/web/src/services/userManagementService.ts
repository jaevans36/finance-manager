import { apiClient, getFullApiUrl } from './api-client';

export interface UserListItem {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  taskCount: number;
  eventCount: number;
}

export interface UserStats {
  totalUsers: number;
  adminUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
}

interface ResetPasswordRequest {
  newPassword: string;
}

interface UserSearchQuery {
  searchTerm?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface UsersResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

class UserManagementService {
  private readonly baseUrl = '/api/admin/users';

  async getUsers(query?: UserSearchQuery): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    if (query?.searchTerm) params.append('searchTerm', query.searchTerm);
    if (query?.isAdmin !== undefined) params.append('isAdmin', String(query.isAdmin));
    if (query?.emailVerified !== undefined) params.append('emailVerified', String(query.emailVerified));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortDirection) params.append('sortDirection', query.sortDirection);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));

    const queryString = params.toString();
    const path = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const url = getFullApiUrl(path);

    const response = await apiClient.get<UsersResponse>(url);
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>(getFullApiUrl(`${this.baseUrl}/stats`));
    return response.data;
  }

  async createUser(request: CreateUserRequest): Promise<UserListItem> {
    const response = await apiClient.post<UserListItem>(getFullApiUrl(this.baseUrl), request);
    return response.data;
  }

  async updateUser(userId: string, request: UpdateUserRequest): Promise<UserListItem> {
    const response = await apiClient.put<UserListItem>(getFullApiUrl(`${this.baseUrl}/${userId}`), request);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(getFullApiUrl(`${this.baseUrl}/${userId}`));
  }

  async resetPassword(userId: string, request: ResetPasswordRequest): Promise<void> {
    await apiClient.post(getFullApiUrl(`${this.baseUrl}/${userId}/reset-password`), request);
  }
}

export const userManagementService = new UserManagementService();
