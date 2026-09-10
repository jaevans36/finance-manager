import { z } from 'zod';
import { completeTask } from '../../api/tasks-api.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  taskId: z.string().uuid().describe('The task id.'),
};

export const completeTaskTool = defineTool({
  name: 'complete_task',
  backend: 'life',
  config: {
    title: 'Complete a task',
    description: 'Mark a task as completed. Safe to call more than once (idempotent).',
    inputSchema,
  },
  async handler(args, { http }) {
    const task = await completeTask(http, { id: args.taskId });
    return textResult(`Completed "${task.title}" (\`${task.id}\`).`, { task });
  },
});
