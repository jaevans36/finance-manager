import { z } from 'zod';
import { deleteTask } from '../../api/tasks-api.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  taskId: z.string().uuid().describe('The task id.'),
};

export const deleteTaskTool = defineTool({
  name: 'delete_task',
  backend: 'life',
  config: {
    title: 'Delete a task',
    description: 'Permanently delete a task. This cannot be undone.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteTask(http, { id: args.taskId });
    return textResult(`Deleted task \`${args.taskId}\`.`);
  },
});
