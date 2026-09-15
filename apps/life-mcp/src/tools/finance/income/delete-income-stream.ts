import { z } from 'zod';
import { deleteIncomeStream } from '../../../api/finance-income-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  streamId: z.string().uuid().describe('Income stream to delete (from finance_get_income_summary).'),
};

export const deleteIncomeStreamTool = defineTool({
  name: 'finance_delete_income_stream',
  backend: 'finance',
  config: {
    title: 'Delete an income stream',
    description: 'Permanently delete an income stream — e.g. a source of income that has stopped. Transactions previously tagged with it are not deleted, just un-tagged.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteIncomeStream(http, args.streamId);
    return textResult(`Deleted income stream ${args.streamId}.`);
  },
});
