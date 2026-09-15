import { applyCategoryRules } from '../../../api/finance-category-rules-api.js';
import { defineTool, textResult } from '../../_register.js';

export const applyCategoryRulesTool = defineTool({
  name: 'finance_apply_category_rules',
  backend: 'finance',
  config: {
    title: 'Apply all rules to unreviewed transactions',
    description:
      'Run every active category rule against all of the current unreviewed transactions, in priority order — ' +
      'use this to bulk-categorise a backlog (e.g. right after a large CSV import) instead of one at a time.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const result = await applyCategoryRules(http);
    return textResult(`Categorised ${result.updated} transaction(s).`, { result });
  },
});
