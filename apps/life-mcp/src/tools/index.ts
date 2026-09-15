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
import { createAccountTool } from './finance/accounts/create-account.js';
import { updateAccountTool } from './finance/accounts/update-account.js';
import { checkAccountCompletenessTool } from './finance/accounts/check-account-completeness.js';
import { getNetWorthTool } from './finance/accounts/get-net-worth.js';
import { getNetWorthHistoryTool } from './finance/accounts/get-net-worth-history.js';
import { getFinanceTransactionsTool } from './finance/transactions/get-transactions.js';
import { addManualTransactionTool } from './finance/transactions/add-manual-transaction.js';
import { importTransactionsTool } from './finance/transactions/import-transactions.js';
import { importTransactionsJsonTool } from './finance/transactions/import-transactions-json.js';
import { searchTransactionsTool } from './finance/transactions/search-transactions.js';
import { categoriseTransactionTool } from './finance/transactions/categorise-transaction.js';
import { tagIncomeStreamTool } from './finance/transactions/tag-income-stream.js';
import { tagTransactionTool } from './finance/transactions/tag-transaction.js';
import { untagTransactionTool } from './finance/transactions/untag-transaction.js';
import { getBillsDueTool } from './finance/bills/get-bills-due.js';
import { getRecurringPaymentsTool } from './finance/bills/get-recurring-payments.js';
import { getBillsTool } from './finance/bills/get-bills.js';
import { createBillTool } from './finance/bills/create-bill.js';
import { updateBillTool } from './finance/bills/update-bill.js';
import { payBillTool } from './finance/bills/pay-bill.js';
import { deleteBillTool } from './finance/bills/delete-bill.js';
import { getPotBalancesTool } from './finance/pots/get-pot-balances.js';
import { updatePotBudgetTool } from './finance/pots/update-pot-budget.js';
import { getMonthlyBudgetSummaryTool } from './finance/budgets/get-monthly-budget-summary.js';
import { getSavingsGoalsTool } from './finance/goals/get-savings-goals.js';
import { updateSavingsGoalTool } from './finance/goals/update-savings-goal.js';
import { getDisposableIncomeTool } from './finance/affordability/get-disposable-income.js';
import { updateIncomeAccountsTool } from './finance/affordability/update-income-accounts.js';
import { getIncomeSummaryTool } from './finance/income/get-income-summary.js';
import { createIncomeStreamTool } from './finance/income/create-income-stream.js';
import { updateIncomeStreamTool } from './finance/income/update-income-stream.js';
import { deleteIncomeStreamTool } from './finance/income/delete-income-stream.js';
import { detectIncomeTool } from './finance/income/detect-income.js';
import { getAiInsightsTool } from './finance/insights/get-ai-insights.js';
import { getDebtOverviewTool } from './finance/debt/get-debt-overview.js';
import { getDebtProjectionTool } from './finance/debt/get-debt-projection.js';
import { getAssetsTool } from './finance/assets/get-assets.js';
import { createAssetTool } from './finance/assets/create-asset.js';
import { updateAssetTool } from './finance/assets/update-asset.js';
import { getCategoriesTool } from './finance/categories/get-categories.js';
import { createCategoryTool } from './finance/categories/create-category.js';
import { getCategoryRulesTool } from './finance/rules/get-category-rules.js';
import { createCategoryRuleTool } from './finance/rules/create-category-rule.js';
import { updateCategoryRuleTool } from './finance/rules/update-category-rule.js';
import { deleteCategoryRuleTool } from './finance/rules/delete-category-rule.js';
import { applyCategoryRulesTool } from './finance/rules/apply-category-rules.js';
import { getTagsTool } from './finance/tags/get-tags.js';
import { createTagTool } from './finance/tags/create-tag.js';
import { deleteTagTool } from './finance/tags/delete-tag.js';

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
 *
 * The 2026-09-15 conversational-data-entry gap pass adds finance_create_account (previously
 * only update existed — no way to add a first account at all) and wraps a batch of
 * finance-api features that already existed server-side but had never been exposed as MCP
 * tools: Debt (overview/projection — an existing avalanche/snowball/custom payoff engine),
 * Assets (manually-tracked property/vehicle/other, nets into net worth), Net Worth
 * (current + history), Income Streams (full CRUD + detect, not just a read-only summary),
 * Categories (list/create), and Affordability's income-accounts scoping (a required setup
 * step for an accurate disposable-income figure on a shared/joint account). Also adds
 * finance_tag_income_transaction + Transaction.IncomeStreamId (backend migration
 * AddIncomeStreamIdToTransaction) so individual credits can be linked to a named income
 * stream — needed because a joint account can receive multiple real income sources (e.g.
 * a partner's salary) that account-level scoping alone can't tell apart.
 *
 * The 2026-09-15 Firefly-III-inspired pass adds two features Firefly does well that this
 * app didn't: an auto-categorisation rules engine (finance_*_category_rule* — the backend
 * CategoryRules feature already existed, just unwrapped) and free-form tags
 * (finance_*_tag* — a genuinely new feature: Tag/TransactionTag, migration AddTags) that
 * cut across spending categories for things like "Wales holiday 2026" spanning flights,
 * food, and fuel.
 */
const financeTools: AnyToolDef[] = [
  getFinanceAccountsTool,
  createAccountTool,
  updateAccountTool,
  checkAccountCompletenessTool,
  getNetWorthTool,
  getNetWorthHistoryTool,
  getFinanceTransactionsTool,
  addManualTransactionTool,
  importTransactionsTool,
  importTransactionsJsonTool,
  searchTransactionsTool,
  categoriseTransactionTool,
  tagIncomeStreamTool,
  tagTransactionTool,
  untagTransactionTool,
  getBillsDueTool,
  getRecurringPaymentsTool,
  getBillsTool,
  createBillTool,
  updateBillTool,
  payBillTool,
  deleteBillTool,
  getPotBalancesTool,
  updatePotBudgetTool,
  getMonthlyBudgetSummaryTool,
  getSavingsGoalsTool,
  updateSavingsGoalTool,
  getDisposableIncomeTool,
  updateIncomeAccountsTool,
  getIncomeSummaryTool,
  createIncomeStreamTool,
  updateIncomeStreamTool,
  deleteIncomeStreamTool,
  detectIncomeTool,
  getAiInsightsTool,
  getDebtOverviewTool,
  getDebtProjectionTool,
  getAssetsTool,
  createAssetTool,
  updateAssetTool,
  getCategoriesTool,
  createCategoryTool,
  getCategoryRulesTool,
  createCategoryRuleTool,
  updateCategoryRuleTool,
  deleteCategoryRuleTool,
  applyCategoryRulesTool,
  getTagsTool,
  createTagTool,
  deleteTagTool,
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
