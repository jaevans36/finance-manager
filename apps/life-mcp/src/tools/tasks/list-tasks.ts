import { z } from 'zod';
import { listTasks } from '../../api/tasks-api.js';
import { PRIORITIES, STATUSES } from '../../types/task.js';
import { todayHint } from '../../utils/format-date.js';
import { formatTaskList } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  status: z.enum(STATUSES).optional().describe('Filter by workflow status.'),
  priority: z.enum(PRIORITIES).optional().describe('Filter by priority.'),
  labelId: z.string().uuid().optional().describe('Filter to tasks carrying this label id.'),
  groupId: z.string().uuid().optional().describe('Filter to a task group.'),
  completed: z.boolean().optional().describe('true = only completed, false = only open. Omit for all.'),
  dueAfter: z.string().optional().describe('ISO date/time — only tasks due on or after this.'),
  dueBefore: z.string().optional().describe('ISO date/time — only tasks due on or before this.'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max tasks to return (default 20).'),
};

export const listTasksTool = defineTool({
  name: 'list_tasks',
  backend: 'life',
  config: {
    title: 'List tasks',
    description: `List the current user's tasks with optional filters, newest-relevant first. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const tasks = await listTasks(http, {
      status: args.status,
      priority: args.priority,
      labelId: args.labelId,
      groupId: args.groupId,
      completed: args.completed,
      startDate: args.dueAfter,
      endDate: args.dueBefore,
    });
    const limited = tasks.slice(0, args.limit);
    const heading = `# Tasks (${limited.length}${tasks.length > limited.length ? ` of ${tasks.length}` : ''})`;
    return textResult(formatTaskList(limited, heading), { tasks: limited });
  },
});
