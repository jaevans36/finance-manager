import { z } from 'zod';
import { createIncomeStream } from '../../../api/finance-income-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1).describe('Name of the income source, e.g. "My salary" or "Jade\'s salary".'),
  monthlyAmount: z.number().describe('Expected monthly amount.'),
  accountId: z.string().uuid().optional().describe('Account this income lands in, if it should be linked to one (from finance_get_accounts).'),
};

export const createIncomeStreamTool = defineTool({
  name: 'finance_create_income_stream',
  backend: 'finance',
  config: {
    title: 'Create an income stream',
    description:
      'Register a named income source (salary, freelance, benefits, etc). Once created, individual credit ' +
      'transactions can be linked to it with finance_tag_income_transaction so multiple income sources landing ' +
      'in the same account (e.g. a joint account) can be told apart for accurate per-stream analysis.',
    inputSchema,
  },
  async handler(args, { http }) {
    const stream = await createIncomeStream(http, args);
    return textResult(`Created income stream "${stream.name}" — £${stream.monthlyAmount}/month.`, { stream });
  },
});
