import { z } from 'zod';
import { listTransactions } from '../../../api/finance-transactions-api.js';
import { formatTransactionList } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account to search within (from finance_get_accounts).'),
  search: z.string().min(1).describe('Free-text search over description/payee — e.g. "Tesco" or "Netflix".'),
  page: z.number().int().min(1).default(1).describe('1-indexed page number.'),
  pageSize: z.number().int().min(1).max(200).default(50).describe('Results per page (max 200).'),
};

export const searchTransactionsTool = defineTool({
  name: 'finance_search_transactions',
  backend: 'finance',
  config: {
    title: 'Search transactions by description or payee',
    description:
      'Find a specific transaction within one account by free-text search over its description/payee — ' +
      'e.g. "was that Tesco transaction from last week categorised?" Use finance_get_transactions instead ' +
      'for browsing recent transactions without a specific search term.',
    inputSchema,
  },
  async handler(args, { http }) {
    const page = await listTransactions(http, args);
    return textResult(formatTransactionList(page, `# Search results for "${args.search}"`), { page });
  },
});
