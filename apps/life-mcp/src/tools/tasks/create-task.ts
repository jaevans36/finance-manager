import { z } from 'zod';
import { createTask } from '../../api/tasks-api.js';
import { ENERGY_LEVELS, PRIORITIES } from '../../types/task.js';
import { todayHint } from '../../utils/format-date.js';
import { formatTaskDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  title: z.string().min(1).max(200).describe('Task title (required).'),
  description: z.string().max(1000).optional(),
  priority: z.enum(PRIORITIES).optional().describe('Low | Medium | High | Critical.'),
  dueDate: z.string().optional().describe('ISO 8601 date/time.'),
  groupId: z.string().uuid().optional(),
  energyLevel: z.enum(ENERGY_LEVELS).optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  reminderAt: z.string().optional().describe('ISO 8601. Requires dueDate to be set.'),
  labelIds: z.array(z.string().uuid()).optional(),
};

export const createTaskTool = defineTool({
  name: 'create_task',
  backend: 'life',
  config: {
    title: 'Create a task',
    description:
      `Create a new task. Only "title" is required. NOT idempotent — calling twice makes two tasks. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const task = await createTask(http, {
      title: args.title,
      description: args.description,
      priority: args.priority,
      dueDate: args.dueDate,
      groupId: args.groupId,
      energyLevel: args.energyLevel,
      estimatedMinutes: args.estimatedMinutes,
      reminderAt: args.reminderAt,
      labelIds: args.labelIds,
    });
    return textResult(`Created:\n\n${formatTaskDetail(task)}`, { task });
  },
});
