export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  parentTaskId: string | null;
  hasSubtasks: boolean;
  subtaskCount: number;
  completedSubtaskCount: number;
  progressPercentage: number;
  subtasks?: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  completed?: boolean;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
