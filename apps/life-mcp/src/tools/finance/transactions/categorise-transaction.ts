import { z } from 'zod';
import { categoriseTransaction } from '../../../api/finance-transactions-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  transactionId: z.string().uuid().describe('Transaction to categorise (from finance_get_transactions or finance_search_transactions).'),
  categoryId: z.string().uuid().describe('Category to assign.'),
};

export const categoriseTransactionTool = defineTool({
  name: 'finance_categorise_transaction',
  backend: 'finance',
  config: {
    title: "Set a transaction's category",
    description: "Assign a category to a transaction — e.g. correcting a miscategorised spend, or filling in one the importer left uncategorised.",
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await categoriseTransaction(http, args.transactionId, args.categoryId);
    return textResult(
      `Categorised "${transaction.description}" as ${transaction.categoryName ?? transaction.categoryId}.`,
      { transaction },
    );
  },
});
