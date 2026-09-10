import { z } from 'zod';
import { addSubtask } from '../../api/tasks-api.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  parentTaskId: z.string().uuid().describe('The parent task id.'),
  title: z.string().min(1).max(200).describe('Subtask title.'),
};

export const addSubtaskTool = defineTool({
  name: 'add_subtask',
  backend: 'life',
  config: {
    title: 'Add a subtask',
    description: 'Add a subtask under an existing task.',
    inputSchema,
  },
  async handler(args, { http }) {
    const created = await addSubtask(http, { parentTaskId: args.parentTaskId, title: args.title });
    return textResult(`Added subtask "${created.title}" (\`${created.id}\`) to \`${args.parentTaskId}\`.`, {
      subtask: created,
    });
  },
});
