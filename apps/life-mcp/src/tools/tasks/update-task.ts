import { z } from 'zod';
import { updateTask } from '../../api/tasks-api.js';
import { ENERGY_LEVELS, PRIORITIES } from '../../types/task.js';
import { todayHint } from '../../utils/format-date.js';
import { formatTaskDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  taskId: z.string().uuid().describe('The task id (required).'),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.string().optional().describe('ISO 8601. A due date cannot be removed via this tool — use the web app.'),
  groupId: z.string().uuid().optional(),
  energyLevel: z.enum(ENERGY_LEVELS).optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  reminderAt: z.string().optional().describe('ISO 8601.'),
  clearReminderAt: z.boolean().optional().describe('Set true to remove an existing reminder.'),
  labelIds: z.array(z.string().uuid()).optional().describe('Replaces the full label set.'),
  completed: z.boolean().optional().describe('Mark complete/incomplete. To just complete a task prefer complete_task.'),
};

export const updateTaskTool = defineTool({
  name: 'update_task',
  backend: 'life',
  config: {
    title: 'Update a task',
    description: `Update fields on an existing task. Omitted fields are left unchanged. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const { taskId, ...rest } = args;
    const task = await updateTask(http, { id: taskId, ...rest });
    return textResult(`Updated:\n\n${formatTaskDetail(task)}`, { task });
  },
});
