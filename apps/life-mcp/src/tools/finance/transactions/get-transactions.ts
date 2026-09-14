import { z } from 'zod';
import { listTransactions } from '../../../api/finance-transactions-api.js';
import { TRANSACTION_TYPES } from '../../../types/finance-transaction.js';
import { formatTransactionList } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account to list transactions for (from finance_get_accounts).'),
  from: z.string().optional().describe('ISO date — only transactions on or after this.'),
  to: z.string().optional().describe('ISO date — only transactions on or before this.'),
  categoryId: z.string().uuid().optional().describe('Filter to one category.'),
  type: z.enum(TRANSACTION_TYPES).optional().describe('Filter by transaction type.'),
  search: z.string().optional().describe('Free-text search over description/payee.'),
  page: z.number().int().min(1).default(1).describe('1-indexed page number.'),
  pageSize: z.number().int().min(1).max(200).default(50).describe('Results per page (max 200).'),
};

export const getFinanceTransactionsTool = defineTool({
  name: 'finance_get_transactions',
  backend: 'finance',
  config: {
    title: 'List transactions for an account',
    description: 'List transactions for one finance account, newest first, with optional date/category/type/search filters.',
    inputSchema,
  },
  async handler(args, { http }) {
    const page = await listTransactions(http, args);
    const heading = `# Transactions`;
    return textResult(formatTransactionList(page, heading), { page });
  },
});
