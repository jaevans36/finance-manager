import { z } from 'zod';
import { addTagToTransaction } from '../../../api/finance-transactions-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  transactionId: z.string().uuid().describe('Transaction to tag (from finance_get_transactions or finance_search_transactions).'),
  tagId: z.string().uuid().describe('Tag to attach (from finance_get_tags).'),
};

export const tagTransactionTool = defineTool({
  name: 'finance_tag_transaction',
  backend: 'finance',
  config: {
    title: 'Attach a tag to a transaction',
    description:
      'Attach a free-form tag to a transaction, on top of its category — e.g. tagging flights, food, and fuel ' +
      'all "Wales holiday 2026" even though they sit in different spending categories.',
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await addTagToTransaction(http, args.transactionId, args.tagId);
    return textResult(`Tagged "${transaction.description}" with ${transaction.tags.length} tag(s).`, { transaction });
  },
});
