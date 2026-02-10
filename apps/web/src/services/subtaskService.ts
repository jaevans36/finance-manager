import { apiClient } from './api-client';
import { statisticsService } from './statisticsService';
import type { Task } from './taskService';

/** Input for creating a single subtask */
export interface CreateSubtaskInput {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
}

/** Response shape for subtask progress */
export interface SubtaskProgress {
  totalCount: number;
  completedCount: number;
  progressPercentage: number;
}

export const subtaskService = {
  /**
   * Fetch all subtasks for a given parent task.
   * Optionally includes nested subtasks (children of children).
   */
  async getSubtasks(taskId: string, includeNested = false): Promise<Task[]> {
    const params = includeNested ? '?includeNested=true' : '';
    const response = await apiClient.get<Task[]>(`/tasks/${taskId}/subtasks${params}`);
    return response.data;
  },

  /** Create a single subtask under a parent task. */
  async createSubtask(taskId: string, input: CreateSubtaskInput): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/subtasks`, input);
    statisticsService.invalidateCache();
    return response.data;
  },

  /** Bulk-create multiple subtasks from an array of titles. */
  async bulkCreateSubtasks(taskId: string, titles: string[]): Promise<Task[]> {
    const response = await apiClient.post<Task[]>(`/tasks/${taskId}/subtasks/bulk`, { titles });
    statisticsService.invalidateCache();
    return response.data;
  },

  /** Reorder subtasks by providing the ordered list of subtask IDs. */
  async reorderSubtasks(taskId: string, orderedIds: string[]): Promise<void> {
    await apiClient.put(`/tasks/${taskId}/subtasks/reorder`, { orderedIds });
  },

  /** Move a subtask to a different parent task. */
  async moveSubtask(taskId: string, subtaskId: string, newParentId: string): Promise<Task> {
    const response = await apiClient.put<Task>(
      `/tasks/${taskId}/subtasks/${subtaskId}/move`,
      { newParentId },
    );
    statisticsService.invalidateCache();
    return response.data;
  },

  /** Mark all subtasks of a parent task as complete. */
  async bulkCompleteSubtasks(taskId: string): Promise<void> {
    await apiClient.put(`/tasks/${taskId}/subtasks/bulk-complete`);
    statisticsService.invalidateCache();
  },

  /** Get the completion progress for a parent task's subtasks. */
  async getProgress(taskId: string): Promise<SubtaskProgress> {
    const response = await apiClient.get<SubtaskProgress>(`/tasks/${taskId}/subtasks/progress`);
    return response.data;
  },
};
