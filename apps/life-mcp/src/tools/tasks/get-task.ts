import { z } from 'zod';
import { getTask } from '../../api/tasks-api.js';
import { formatTaskDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  taskId: z.string().uuid().describe('The task id.'),
  includeSubtasks: z.boolean().default(true).describe('Expand subtasks in the response (default true).'),
};

export const getTaskTool = defineTool({
  name: 'get_task',
  backend: 'life',
  config: {
    title: 'Get a task',
    description: 'Fetch one task by id, including its subtasks and labels.',
    inputSchema,
  },
  async handler(args, { http }) {
    const task = await getTask(http, { id: args.taskId, includeSubtasks: args.includeSubtasks });
    return textResult(formatTaskDetail(task), { task });
  },
});
