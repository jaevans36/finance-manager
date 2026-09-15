import { getInsightsSummary } from '../../../api/finance-insights-api.js';
import { formatInsights } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getAiInsightsTool = defineTool({
  name: 'finance_get_ai_insights',
  backend: 'finance',
  config: {
    title: 'Get AI insight cards',
    description:
      'Get proactive insight cards — spending velocity (on track to overspend this month?), anomalies ' +
      '(category spend spikes, new high-value merchants, potential duplicate charges), and subscription review.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const summary = await getInsightsSummary(http);
    return textResult(formatInsights(summary, '# AI Insights'), { summary });
  },
});
