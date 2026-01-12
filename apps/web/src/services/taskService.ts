import { apiClient } from './api-client';
import { statisticsService } from './statisticsService';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  groupId?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  completed?: boolean;
  groupId?: string;
}

interface TaskQueryParams {
  groupId?: string;
  priority?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
}

export const taskService = {
  async getTasks(params?: TaskQueryParams): Promise<Task[]> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    
    const response = await apiClient.get<Task[]>(`/tasks${queryString}`);
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', input);
    
    // Invalidate statistics cache when tasks are modified
    statisticsService.invalidateCache();
    
    return response.data;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, input);
    
    // Invalidate statistics cache when tasks are modified
    statisticsService.invalidateCache();
    
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
    
    // Invalidate statistics cache when tasks are modified
    statisticsService.invalidateCache();
  },

  async toggleTask(id: string, completed: boolean): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, { completed });
    
    // Invalidate statistics cache when tasks are modified
    statisticsService.invalidateCache();
    
    return response.data;
  },
};
