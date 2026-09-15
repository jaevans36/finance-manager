import { listCategoryRules } from '../../../api/finance-category-rules-api.js';
import { defineTool, textResult } from '../../_register.js';

export const getCategoryRulesTool = defineTool({
  name: 'finance_get_category_rules',
  backend: 'finance',
  config: {
    title: 'List category rules',
    description:
      'List every auto-categorisation rule — pattern, match type, target category, priority, active state, ' +
      'and how many times each has fired. Use finance_apply_category_rules to run them against existing ' +
      'unreviewed transactions rather than waiting for new imports.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const rules = await listCategoryRules(http);
    const lines = [
      `# Category rules (${rules.length})`,
      ...rules.map(
        (r) =>
          `- ${r.isActive ? '' : '~~'}"${r.pattern}" (${r.matchType}) → ${r.categoryName ?? r.categoryId}${r.isActive ? '' : '~~ (inactive)'}` +
          ` · priority ${r.priority} · applied ${r.appliedCount}×  \`${r.id}\``,
      ),
    ];
    return textResult(lines.join('\n'), { rules });
  },
});
