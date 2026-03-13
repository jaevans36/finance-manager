import { apiClient } from './api-client';
import { statisticsService } from './statisticsService';

export type TaskStatus = 'NotStarted' | 'InProgress' | 'Blocked' | 'Completed';
export type UrgencyLevel = 'Low' | 'Medium' | 'High';
export type ImportanceLevel = 'Low' | 'Medium' | 'High';
export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  status: TaskStatus;
  startedAt: string | null;
  blockedReason: string | null;
  urgency: UrgencyLevel | null;
  importance: ImportanceLevel | null;
  quadrant: Quadrant | null;
  energyLevel: EnergyLevel | null;
  estimatedMinutes: number | null;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  parentTaskId: string | null;
  hasSubtasks: boolean;
  subtaskCount: number;
  completedSubtaskCount: number;
  progressPercentage: number;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
  assignedToUserId: string | null;
  assignedToUsername: string | null;
  assignedByUserId: string | null;
  assignedByUsername: string | null;
  isOwner: boolean;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  groupId?: string;
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  completed?: boolean;
  groupId?: string;
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number;
}

interface TaskQueryParams {
  groupId?: string;
  priority?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  status?: TaskStatus;
  view?: 'all' | 'mine' | 'assigned-to-me' | 'assigned-by-me';
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

  async updateTaskStatus(id: string, status: TaskStatus, blockedReason?: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, {
      status,
      blockedReason,
    });

    statisticsService.invalidateCache();

    return response.data;
  },

  async classifyTask(id: string, urgency?: UrgencyLevel, importance?: ImportanceLevel): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/classify`, {
      urgency,
      importance,
    });

    statisticsService.invalidateCache();

    return response.data;
  },

  async bulkClassifyTasks(items: Array<{ taskId: string; urgency?: UrgencyLevel; importance?: ImportanceLevel }>): Promise<Task[]> {
    const response = await apiClient.post<Task[]>('/tasks/bulk-classify', { items });

    statisticsService.invalidateCache();

    return response.data;
  },

  async getMatrixTasks(params?: { groupId?: string; priority?: string; includeCompleted?: boolean }): Promise<MatrixResponse> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    const response = await apiClient.get<MatrixResponse>(`/tasks/matrix${queryString}`);
    return response.data;
  },

  async getSuggestion(id: string): Promise<ClassificationSuggestion> {
    const response = await apiClient.get<ClassificationSuggestion>(`/tasks/${id}/suggest-classification`);
    return response.data;
  },

  async previewAutoClassify(): Promise<ClassificationSuggestion[]> {
    const response = await apiClient.post<ClassificationSuggestion[]>('/tasks/auto-classify');
    return response.data;
  },

  async setEnergy(id: string, energyLevel: EnergyLevel): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/energy`, { energyLevel });
    statisticsService.invalidateCache();
    return response.data;
  },

  async setEstimate(id: string, estimatedMinutes: number): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/estimate`, { estimatedMinutes });
    statisticsService.invalidateCache();
    return response.data;
  },

  async bulkSetEnergy(items: Array<{ taskId: string; energyLevel: EnergyLevel }>): Promise<Task[]> {
    const response = await apiClient.post<Task[]>('/tasks/bulk-energy', { items });
    statisticsService.invalidateCache();
    return response.data;
  },

  async getSuggestions(params?: { energy?: EnergyLevel; maxMinutes?: number }): Promise<Task[]> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    const response = await apiClient.get<Task[]>(`/tasks/suggestions${queryString}`);
    return response.data;
  },

  async getEnergyDistribution(): Promise<EnergyDistribution> {
    const response = await apiClient.get<EnergyDistribution>('/tasks/energy-distribution');
    return response.data;
  },

  async assignTask(id: string, usernameOrEmail: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/assign`, { usernameOrEmail });
    statisticsService.invalidateCache();
    return response.data;
  },

  async unassignTask(id: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/unassign`, {});
    statisticsService.invalidateCache();
    return response.data;
  },
};

export interface MatrixResponse {
  q1DoFirst: Task[];
  q2Schedule: Task[];
  q3Delegate: Task[];
  q4Eliminate: Task[];
  unclassified: Task[];
}

export interface ClassificationSuggestion {
  taskId: string;
  title: string;
  suggestedUrgency: UrgencyLevel | null;
  suggestedImportance: ImportanceLevel | null;
  suggestedQuadrant: Quadrant | null;
  reason: string;
  currentUrgency: UrgencyLevel | null;
  currentImportance: ImportanceLevel | null;
}

export interface EnergyDistribution {
  highEnergyCount: number;
  mediumEnergyCount: number;
  lowEnergyCount: number;
  untaggedCount: number;
  highEnergyCompletionRate: number;
  mediumEnergyCompletionRate: number;
  lowEnergyCompletionRate: number;
}
