import { listTags } from '../../../api/finance-tags-api.js';
import { defineTool, textResult } from '../../_register.js';

export const getTagsTool = defineTool({
  name: 'finance_get_tags',
  backend: 'finance',
  config: {
    title: 'List tags',
    description:
      'List free-form tags — cut across spending categories for things like "Wales holiday 2026" or ' +
      '"kitchen reno" that span multiple categories. Shows how many transactions use each.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const tags = await listTags(http);
    const lines = [
      `# Tags (${tags.length})`,
      ...tags.map((t) => `- ${t.name} (${t.transactionCount} transaction(s))  \`${t.id}\``),
    ];
    return textResult(lines.join('\n'), { tags });
  },
});
