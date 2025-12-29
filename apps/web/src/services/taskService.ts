import { apiClient } from './api-client';

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



export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks');
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', input);
    return response.data;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, input);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async toggleTask(id: string, completed: boolean): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, { completed });
    return response.data;
  },
};
