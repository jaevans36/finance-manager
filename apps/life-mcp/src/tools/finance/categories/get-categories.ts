import { listCategories } from '../../../api/finance-categories-api.js';
import type { CategoryDto } from '../../../types/finance-category.js';
import { defineTool, textResult } from '../../_register.js';

function line(c: CategoryDto, depth: number): string[] {
  const out = [`${'  '.repeat(depth)}- ${c.name}${c.isSystem ? '' : ' (custom)'}  \`${c.id}\``];
  for (const child of c.children ?? []) out.push(...line(child, depth + 1));
  return out;
}

export const getCategoriesTool = defineTool({
  name: 'finance_get_categories',
  backend: 'finance',
  config: {
    title: 'List spending categories',
    description:
      'List all spending categories (system-defined and user-created), with their ids — needed to use ' +
      'finance_categorise_transaction, finance_add_manual_transaction, or finance_import_transactions_json.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const categories = await listCategories(http);
    const lines = ['# Categories', ...categories.flatMap((c) => line(c, 0))];
    return textResult(lines.join('\n'), { categories });
  },
});
