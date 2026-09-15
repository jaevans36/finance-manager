import { z } from 'zod';
import { tagIncomeStream } from '../../../api/finance-transactions-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  transactionId: z.string().uuid().describe('Transaction to tag (from finance_get_transactions or finance_search_transactions).'),
  incomeStreamId: z.string().uuid().describe('Income stream to link it to (from finance_get_income_summary).'),
};

export const tagIncomeStreamTool = defineTool({
  name: 'finance_tag_income_transaction',
  backend: 'finance',
  config: {
    title: 'Tag a transaction as an income stream',
    description:
      'Link a specific credit transaction to a named income stream (e.g. "my salary", "Jade\'s salary") — ' +
      'distinct from just categorising it. Useful when several income sources land in the same shared account ' +
      'and need to be told apart for accurate per-stream totals and trends over time.',
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await tagIncomeStream(http, args.transactionId, args.incomeStreamId);
    return textResult(
      `Tagged "${transaction.description}" as ${transaction.incomeStreamName ?? transaction.incomeStreamId}.`,
      { transaction },
    );
  },
});
