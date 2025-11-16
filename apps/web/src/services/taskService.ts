import { apiClient } from './api-client';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  completed?: boolean;
}

interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export const taskService = {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    completed?: boolean;
  }): Promise<TaskListResponse> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', { params });
    return {
      tasks: response.data.data || [],
      pagination: response.data.pagination!,
    };
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data!;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', input);
    return response.data.data!;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, input);
    return response.data.data!;
  },

  async toggleComplete(id: string): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/complete`);
    return response.data.data!;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async getOverdueTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/overdue');
    return response.data.data || [];
  },
};
