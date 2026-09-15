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
import { updateAccountTool } from './finance/accounts/update-account.js';
import { checkAccountCompletenessTool } from './finance/accounts/check-account-completeness.js';
import { getFinanceTransactionsTool } from './finance/transactions/get-transactions.js';
import { addManualTransactionTool } from './finance/transactions/add-manual-transaction.js';
import { importTransactionsTool } from './finance/transactions/import-transactions.js';
import { importTransactionsJsonTool } from './finance/transactions/import-transactions-json.js';
import { searchTransactionsTool } from './finance/transactions/search-transactions.js';
import { categoriseTransactionTool } from './finance/transactions/categorise-transaction.js';
import { getBillsDueTool } from './finance/bills/get-bills-due.js';
import { getRecurringPaymentsTool } from './finance/bills/get-recurring-payments.js';
import { getPotBalancesTool } from './finance/pots/get-pot-balances.js';
import { updatePotBudgetTool } from './finance/pots/update-pot-budget.js';
import { getMonthlyBudgetSummaryTool } from './finance/budgets/get-monthly-budget-summary.js';
import { getSavingsGoalsTool } from './finance/goals/get-savings-goals.js';
import { updateSavingsGoalTool } from './finance/goals/update-savings-goal.js';
import { getDisposableIncomeTool } from './finance/affordability/get-disposable-income.js';
import { getIncomeSummaryTool } from './finance/income/get-income-summary.js';
import { getAiInsightsTool } from './finance/insights/get-ai-insights.js';

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
 * read-only access plus one write (manual transaction entry).
 *
 * Slice 2 (see docs/intent/2026-09-14-finance-mcp-statement-ingestion.md) adds statement
 * ingestion (CSV exports and PDF statements, both via the same generic-CSV path finance-api
 * already supports) and debt-account entry/completeness-checking.
 *
 * Slice 3 (see docs/intent/2026-09-14-finance-mcp-reporting-tools.md) adds the remaining
 * Phase 49 tools that are pure wrappers over already-tested finance-api endpoints: transaction
 * search/categorise, recurring-payment detection, pot budget updates, monthly budget/income
 * summaries, savings goal updates, and AI insights. Still deliberately out of scope: the tools
 * with no backend endpoint at all (transaction summary, bill history, bill-flag-for-review,
 * pot transactions, financial health score, cashflow forecast, monthly report, tax year
 * summary, compare months, export) — each needs a real finance-api design decision first.
 *
 * finance_import_transactions_json (see docs/intent/2026-09-15-finance-json-transaction-import.md)
 * adds a structured-JSON alternative to the CSV import path, for when category/payee/notes are
 * already known and shouldn't be lost in a CSV round-trip.
 */
const financeTools: AnyToolDef[] = [
  getFinanceAccountsTool,
  updateAccountTool,
  checkAccountCompletenessTool,
  getFinanceTransactionsTool,
  addManualTransactionTool,
  importTransactionsTool,
  importTransactionsJsonTool,
  searchTransactionsTool,
  categoriseTransactionTool,
  getBillsDueTool,
  getRecurringPaymentsTool,
  getPotBalancesTool,
  updatePotBudgetTool,
  getMonthlyBudgetSummaryTool,
  getSavingsGoalsTool,
  updateSavingsGoalTool,
  getDisposableIncomeTool,
  getIncomeSummaryTool,
  getAiInsightsTool,
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
