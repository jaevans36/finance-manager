import { z } from 'zod';
import { updateCategoryRule } from '../../../api/finance-category-rules-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  ruleId: z.string().uuid().describe('Rule to update (from finance_get_category_rules).'),
  isActive: z.boolean().optional().describe('Toggle the rule on/off without deleting it.'),
  priority: z.number().int().optional(),
  categoryId: z.string().uuid().optional(),
};

export const updateCategoryRuleTool = defineTool({
  name: 'finance_update_category_rule',
  backend: 'finance',
  config: {
    title: 'Update a category rule',
    description: 'Toggle a rule active/inactive, or change its priority or target category. The pattern/matchType themselves cannot be edited — delete and recreate the rule for those.',
    inputSchema,
  },
  async handler(args, { http }) {
    const { ruleId, ...updates } = args;
    const rule = await updateCategoryRule(http, ruleId, updates);
    return textResult(`Updated rule "${rule.pattern}" — ${rule.isActive ? 'active' : 'inactive'}, priority ${rule.priority}.`, { rule });
  },
});
