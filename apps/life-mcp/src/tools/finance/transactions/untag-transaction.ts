import { z } from 'zod';
import { removeTagFromTransaction } from '../../../api/finance-transactions-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  transactionId: z.string().uuid().describe('Transaction to untag (from finance_get_transactions or finance_search_transactions).'),
  tagId: z.string().uuid().describe('Tag to remove (from finance_get_tags).'),
};

export const untagTransactionTool = defineTool({
  name: 'finance_untag_transaction',
  backend: 'finance',
  config: {
    title: 'Remove a tag from a transaction',
    description: 'Remove a previously-attached tag from a transaction.',
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await removeTagFromTransaction(http, args.transactionId, args.tagId);
    return textResult(`Removed tag — "${transaction.description}" now has ${transaction.tags.length} tag(s).`, { transaction });
  },
});
