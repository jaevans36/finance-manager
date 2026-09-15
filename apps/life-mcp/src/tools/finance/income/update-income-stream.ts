import { z } from 'zod';
import { updateIncomeStream } from '../../../api/finance-income-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  streamId: z.string().uuid().describe('Income stream to update (from finance_get_income_summary).'),
  name: z.string().min(1).optional(),
  monthlyAmount: z.number().optional(),
  accountId: z.string().uuid().optional(),
};

export const updateIncomeStreamTool = defineTool({
  name: 'finance_update_income_stream',
  backend: 'finance',
  config: {
    title: 'Update an income stream',
    description: "Update an income stream's name, monthly amount, or linked account — e.g. after a pay rise.",
    inputSchema,
  },
  async handler(args, { http }) {
    const { streamId, ...updates } = args;
    const stream = await updateIncomeStream(http, streamId, updates);
    return textResult(`Updated "${stream.name}" — now £${stream.monthlyAmount}/month.`, { stream });
  },
});
