import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BackendRegistry } from '../backends/types.js';
import { type AnyToolDef, registerTool } from './_register.js';

import { listTasksTool } from './tasks/list-tasks.js';
import { getTaskTool } from './tasks/get-task.js';
import { createTaskTool } from './tasks/create-task.js';
import { updateTaskTool } from './tasks/update-task.js';
import { completeTaskTool } from './tasks/complete-task.js';
import { deleteTaskTool } from './tasks/delete-task.js';
import { addSubtaskTool } from './tasks/add-subtask.js';

const taskTools: AnyToolDef[] = [
  listTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  completeTaskTool,
  deleteTaskTool,
  addSubtaskTool,
];

/** Every tool the server exposes. Add event/label/finance arrays here as they land. */
export const allTools: AnyToolDef[] = [...taskTools];

export function registerTools(server: McpServer, backends: BackendRegistry): void {
  for (const def of allTools) {
    registerTool(server, backends, def);
  }
}
