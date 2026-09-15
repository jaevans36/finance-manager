import { z } from 'zod';
import { createCategoryRule } from '../../../api/finance-category-rules-api.js';
import { RULE_MATCH_TYPES } from '../../../types/finance-category-rule.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  pattern: z.string().min(1).describe('Text to match against a transaction\'s description/payee, e.g. "TESCO".'),
  matchType: z.enum(RULE_MATCH_TYPES).describe('Contains (most common), StartsWith, or Exact.'),
  categoryId: z.string().uuid().describe('Category to assign when this rule matches (from finance_get_categories).'),
  priority: z.number().int().optional().describe('Lower runs first when multiple rules match the same transaction (default 100).'),
};

export const createCategoryRuleTool = defineTool({
  name: 'finance_create_category_rule',
  backend: 'finance',
  config: {
    title: 'Create an auto-categorisation rule',
    description:
      'Create a rule that auto-assigns a category to any transaction matching a text pattern — e.g. "TESCO" ' +
      'Contains → Groceries — so future imports don\'t need manual categorising. Run finance_apply_category_rules ' +
      'afterward to apply it retroactively to existing unreviewed transactions.',
    inputSchema,
  },
  async handler(args, { http }) {
    const rule = await createCategoryRule(http, args);
    return textResult(`Created rule: "${rule.pattern}" (${rule.matchType}) → ${rule.categoryName ?? rule.categoryId}.`, { rule });
  },
});
