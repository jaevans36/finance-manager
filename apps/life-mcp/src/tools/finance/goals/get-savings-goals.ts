import { listSavingsGoals } from '../../../api/finance-goals-api.js';
import { formatSavingsGoals } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getSavingsGoalsTool = defineTool({
  name: 'finance_get_savings_goals',
  backend: 'finance',
  config: {
    title: 'List savings goals',
    description: "List the current user's savings goals with progress, projected completion date, and whether each is on track.",
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const goals = await listSavingsGoals(http);
    return textResult(formatSavingsGoals(goals, '# Savings Goals'), { goals });
  },
});
