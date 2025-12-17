export interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  colour: string;
  icon?: string;
  isDefault: boolean;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskGroupRequest {
  name: string;
  description?: string;
  colour?: string;
  icon?: string;
}

export interface UpdateTaskGroupRequest {
  name?: string;
  description?: string;
  colour?: string;
  icon?: string;
}
