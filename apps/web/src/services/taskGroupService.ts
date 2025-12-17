import { apiClient } from './api-client';
import { TaskGroup, CreateTaskGroupRequest, UpdateTaskGroupRequest } from '../types/taskGroup';

export const taskGroupService = {
  async getGroups(): Promise<TaskGroup[]> {
    const response = await apiClient.get<TaskGroup[]>('/task-groups');
    return response.data;
  },

  async getGroup(id: string): Promise<TaskGroup> {
    const response = await apiClient.get<TaskGroup>(`/task-groups/${id}`);
    return response.data;
  },

  async createGroup(input: CreateTaskGroupRequest): Promise<TaskGroup> {
    const response = await apiClient.post<TaskGroup>('/task-groups', input);
    return response.data;
  },

  async updateGroup(id: string, input: UpdateTaskGroupRequest): Promise<TaskGroup> {
    const response = await apiClient.put<TaskGroup>(`/task-groups/${id}`, input);
    return response.data;
  },

  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/task-groups/${id}`);
  },
};
