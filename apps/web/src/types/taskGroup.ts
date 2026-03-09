export type SharePermission = 'View' | 'Edit';

export interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  colour: string;
  icon?: string;
  isDefault: boolean;
  wipLimit?: number | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
  // Set when this group is shared with the current user (not owned by them)
  sharedPermission?: SharePermission | null;
  sharedByUsername?: string | null;
}

export interface CreateTaskGroupRequest {
  name: string;
  description?: string;
  colour?: string;
  icon?: string;
  wipLimit?: number;
}

export interface UpdateTaskGroupRequest {
  name?: string;
  description?: string;
  colour?: string;
  icon?: string;
  wipLimit?: number;
}
