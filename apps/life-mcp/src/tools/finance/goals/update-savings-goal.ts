import { z } from 'zod';
import { updateSavingsGoal } from '../../../api/finance-goals-api.js';
import { formatSavingsGoals } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  goalId: z.string().uuid().describe('Goal to update (from finance_get_savings_goals).'),
  name: z.string().optional().describe('New goal name.'),
  targetAmount: z.number().positive().optional().describe('New target amount.'),
  targetDate: z.string().optional().describe('New ISO target date.'),
  monthlyContribution: z.number().min(0).optional().describe('New planned monthly contribution.'),
};

export const updateSavingsGoalTool = defineTool({
  name: 'finance_update_savings_goal',
  backend: 'finance',
  config: {
    title: 'Update a savings goal',
    description:
      'Update a savings goal — e.g. "move my holiday fund target to £3,000" or "I can only put £50/mo towards ' +
      'the washing machine now". Only the fields you pass are changed.',
    inputSchema,
  },
  async handler(args, { http }) {
    const { goalId, ...updates } = args;
    const goal = await updateSavingsGoal(http, goalId, updates);
    return textResult(formatSavingsGoals([goal], '# Updated'), { goal });
  },
});
