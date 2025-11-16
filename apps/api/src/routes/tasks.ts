import { Router, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '@finance-manager/schema';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// POST /api/v1/tasks - Create a new task
router.post(
  '/',
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { title, description, priority, dueDate } = req.body;

      const task = await taskService.createTask({
        userId: req.user.userId,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/tasks - List user's tasks with pagination and filters
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate query parameters
    const query = taskQuerySchema.parse(req.query);

    const result = await taskService.findByUser(req.user.userId, {
      page: query.page,
      limit: query.limit,
      priority: query.priority,
      completed: query.completed,
      dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
      dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tasks/overdue - Get overdue tasks
router.get('/overdue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const tasks = await taskService.getOverdueTasks(req.user.userId);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tasks/:id - Get a single task by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const task = await taskService.findById(req.params.id, req.user.userId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/tasks/:id - Update a task
router.put(
  '/:id',
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { title, description, priority, dueDate, completed } = req.body;

      const task = await taskService.updateTask(req.params.id, req.user.userId, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completed,
      });

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        next(new AppError('Task not found', 404));
      } else {
        next(error);
      }
    }
  }
);

// PATCH /api/v1/tasks/:id/complete - Toggle task completion
router.patch('/:id/complete', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const task = await taskService.toggleComplete(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      next(new AppError('Task not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/v1/tasks/:id - Delete a task
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    await taskService.deleteTask(req.params.id, req.user.userId);

    res.status(200).json({
      success: true,
      data: { message: 'Task deleted successfully' },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      next(new AppError('Task not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;
