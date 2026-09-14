import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BackendRegistry } from '../backends/types.js';
import { log } from '../utils/logger.js';
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

import { getFinanceAccountsTool } from './finance/accounts/get-accounts.js';
import { getFinanceTransactionsTool } from './finance/transactions/get-transactions.js';
import { addManualTransactionTool } from './finance/transactions/add-manual-transaction.js';
import { getBillsDueTool } from './finance/bills/get-bills-due.js';
import { getPotBalancesTool } from './finance/pots/get-pot-balances.js';
import { getSavingsGoalsTool } from './finance/goals/get-savings-goals.js';
import { getDisposableIncomeTool } from './finance/affordability/get-disposable-income.js';

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

/**
 * finance-mcp core tools slice 1 (see docs/intent/2026-09-13-finance-mcp-and-ingestion.md):
 * read-only access plus one write (manual transaction entry). The remaining Phase 49 tools
 * (transaction summary/search/categorise, bill history, pot contributions, budget summary,
 * income summary, savings goal updates, financial health score, AI insights, cashflow
 * forecast, monthly report, tax year summary, compare months, export, and CSV/PDF ingestion)
 * are deliberately out of scope here — a follow-up slice, same two-slice pattern used for the
 * VPS migration.
 */
const financeTools: AnyToolDef[] = [
  getFinanceAccountsTool,
  getFinanceTransactionsTool,
  addManualTransactionTool,
  getBillsDueTool,
  getPotBalancesTool,
  getSavingsGoalsTool,
  getDisposableIncomeTool,
];

/** Every tool the server exposes. Add fitness arrays here as they land. */
export const allTools: AnyToolDef[] = [...taskTools, ...eventTools, ...labelTools, ...financeTools];

/**
 * Register every tool whose backend is configured. A tool whose backend is missing
 * (e.g. finance_* tools when FIN_API_BASE_URL isn't set) is skipped with a warning
 * rather than crashing the whole server — finance-api is an optional backend.
 */
export function registerTools(server: McpServer, backends: BackendRegistry): void {
  for (const def of allTools) {
    if (!backends[def.backend]) {
      log.warn(`Skipping tool "${def.name}" — backend "${def.backend}" is not configured.`);
      continue;
    }
    registerTool(server, backends, def);
  }
}
