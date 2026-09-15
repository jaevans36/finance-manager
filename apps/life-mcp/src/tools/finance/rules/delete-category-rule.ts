import { z } from 'zod';
import { deleteCategoryRule } from '../../../api/finance-category-rules-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  ruleId: z.string().uuid().describe('Rule to delete (from finance_get_category_rules).'),
};

export const deleteCategoryRuleTool = defineTool({
  name: 'finance_delete_category_rule',
  backend: 'finance',
  config: {
    title: 'Delete a category rule',
    description: 'Permanently delete an auto-categorisation rule. Transactions it already categorised keep their category.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteCategoryRule(http, args.ruleId);
    return textResult(`Deleted rule ${args.ruleId}.`);
  },
});
