import { listLabels } from '../../api/labels-api.js';
import { formatLabelList } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

export const listLabelsTool = defineTool({
  name: 'list_labels',
  backend: 'life',
  config: {
    title: 'List labels',
    description: "List the user's task labels with their id and colour.",
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const labels = await listLabels(http);
    return textResult(formatLabelList(labels), { labels });
  },
});
