import { listIncomeStreams } from '../../../api/finance-income-api.js';
import { formatIncomeSummary } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getIncomeSummaryTool = defineTool({
  name: 'finance_get_income_summary',
  backend: 'finance',
  config: {
    title: 'Get income summary',
    description: 'Get a summary of total monthly income across all income streams, plus the per-stream breakdown.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const streams = await listIncomeStreams(http);
    return textResult(formatIncomeSummary(streams, '# Income Summary'), { streams });
  },
});
