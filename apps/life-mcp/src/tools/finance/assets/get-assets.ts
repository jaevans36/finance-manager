import { listAssets } from '../../../api/finance-assets-api.js';
import { defineTool, textResult } from '../../_register.js';

export const getAssetsTool = defineTool({
  name: 'finance_get_assets',
  backend: 'finance',
  config: {
    title: 'List manually-tracked assets',
    description:
      'List manually-tracked real assets (property, vehicle, other) that net into net worth alongside finance ' +
      'accounts. These have no automated valuation — use finance_update_asset to refresh a value occasionally.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const assets = await listAssets(http);
    const total = assets.reduce((sum, a) => sum + a.value, 0);
    const lines = [
      `# Assets (${assets.length}) — total £${total}`,
      ...assets.map((a) => `- **${a.name}** (${a.type}): £${a.value}${a.notes ? ` — ${a.notes}` : ''}  \`${a.id}\``),
    ];
    return textResult(lines.join('\n'), { assets });
  },
});
