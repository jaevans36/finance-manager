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

import { listEventsTool } from './events/list-events.js';
import { getEventTool } from './events/get-event.js';
import { createEventTool } from './events/create-event.js';
import { updateEventTool } from './events/update-event.js';
import { deleteEventTool } from './events/delete-event.js';

import { listLabelsTool } from './labels/list-labels.js';
import { createLabelTool } from './labels/create-label.js';

const taskTools: AnyToolDef[] = [
  listTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  completeTaskTool,
  deleteTaskTool,
  addSubtaskTool,
];

const eventTools: AnyToolDef[] = [
  listEventsTool,
  getEventTool,
  createEventTool,
  updateEventTool,
  deleteEventTool,
];

const labelTools: AnyToolDef[] = [listLabelsTool, createLabelTool];

/** Every tool the server exposes. Add finance/fitness arrays here as they land. */
export const allTools: AnyToolDef[] = [...taskTools, ...eventTools, ...labelTools];

export function registerTools(server: McpServer, backends: BackendRegistry): void {
  for (const def of allTools) {
    registerTool(server, backends, def);
  }
}
