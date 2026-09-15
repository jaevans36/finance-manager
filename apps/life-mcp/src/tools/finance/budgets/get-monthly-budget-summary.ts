import { getCurrentBudgets } from '../../../api/finance-budgets-api.js';
import { formatBudgetSummary } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getMonthlyBudgetSummaryTool = defineTool({
  name: 'finance_get_monthly_budget_summary',
  backend: 'finance',
  config: {
    title: "Get this month's budget summary",
    description:
      "Get a summary of this month's budgets — total budgeted vs. spent, plus the per-category breakdown " +
      'with which categories are over or close to budget.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const budgets = await getCurrentBudgets(http);
    return textResult(formatBudgetSummary(budgets, '# Budget Summary'), { budgets });
  },
});
