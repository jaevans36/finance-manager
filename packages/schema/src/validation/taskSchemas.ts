import { z } from 'zod';

export const priorityEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  priority: priorityEnum.default('MEDIUM'),
  dueDate: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime()) && dateObj > new Date();
    }, 'Due date must be valid and in the future'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  priority: priorityEnum.optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime());
    }, 'Due date must be valid'),
  completed: z.boolean().optional(),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  priority: priorityEnum.optional(),
  completed: z.coerce.boolean().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
