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
