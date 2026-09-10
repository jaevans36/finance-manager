import type { LabelDto } from './label.js';

/**
 * Mirrors apps/life-api/Features/Tasks/DTOs/TaskDtos.cs. Enums are the REAL life-api
 * string enums (the platform spec's numeric 1-5 priority is wrong).
 */

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['NotStarted', 'InProgress', 'Blocked', 'Completed'] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const ENERGY_LEVELS = ['Low', 'Medium', 'High'] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export interface AssignedUser {
  id: string;
  username: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  priority: Priority | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  status: TaskStatus;
  startedAt: string | null;
  blockedReason: string | null;
  urgency: string | null;
  importance: string | null;
  quadrant: string | null;
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
  subtasks?: TaskDto[] | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  assignedTo: AssignedUser | null;
  assignedBy: AssignedUser | null;
  reminderAt: string | null;
  labels: LabelDto[];
}

/** POST /api/v1/tasks body. */
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  groupId?: string;
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number;
  reminderAt?: string;
  labelIds?: string[];
}

/**
 * PUT /api/v1/tasks/{id} body. life-api merges field-by-field (omitted = unchanged).
 * No `status` here — status transitions go through completeTask / the web app.
 * `dueDate` cannot be cleared via this API (no clearDueDate flag); `clearReminderAt`
 * is the only "unset" affordance.
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  groupId?: string;
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number;
  reminderAt?: string;
  labelIds?: string[];
  completed?: boolean;
  clearReminderAt?: boolean;
}
