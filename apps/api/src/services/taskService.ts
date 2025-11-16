import prisma from '../config/database';

type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  completed?: boolean;
}

interface TaskQueryOptions {
  page?: number;
  limit?: number;
  priority?: Priority;
  completed?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export class TaskService {
  async createTask(input: CreateTaskInput): Promise<Task> {
    return prisma.task.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        priority: input.priority || 'MEDIUM',
        dueDate: input.dueDate,
      },
    });
  }

  async findById(taskId: string, userId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });
  }

  async findByUser(userId: string, options: TaskQueryOptions = {}): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      priority,
      completed,
      dueBefore,
      dueAfter,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (priority) {
      where.priority = priority;
    }

    if (completed !== undefined) {
      where.completed = completed;
    }

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) {
        (where.dueDate as Record<string, unknown>).lte = dueBefore;
      }
      if (dueAfter) {
        (where.dueDate as Record<string, unknown>).gte = dueAfter;
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task> {
    // First check if task exists and belongs to user
    const task = await this.findById(taskId, userId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
      updateData.completedAt = input.completed ? new Date() : null;
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  async toggleComplete(taskId: string, userId: string): Promise<Task> {
    const task = await this.findById(taskId, userId);
    if (!task) {
      throw new Error('Task not found');
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
    });
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.findById(taskId, userId);
    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          lt: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}

export const taskService = new TaskService();
