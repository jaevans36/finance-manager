import { z } from 'zod';
import { createTransaction } from '../../../api/finance-transactions-api.js';
import { TRANSACTION_TYPES } from '../../../types/finance-transaction.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account this transaction belongs to (from finance_get_accounts).'),
  type: z.enum(TRANSACTION_TYPES).describe('Debit, Credit, or Transfer.'),
  amount: z.number().positive().describe('Transaction magnitude (always positive; sign comes from type).'),
  description: z.string().min(1).max(500).describe('What the transaction was for.'),
  transactionDate: z.string().describe('ISO date the transaction happened.'),
  categoryId: z.string().uuid().optional().describe('Category to file this under.'),
  currency: z.string().length(3).optional().describe('ISO currency code — defaults to the account currency.'),
  payee: z.string().max(200).optional().describe('Who was paid or who paid.'),
  postingDate: z.string().optional().describe('ISO date the transaction posted, if different from transactionDate.'),
  reference: z.string().max(200).optional().describe('Bank reference, if any.'),
  notes: z.string().max(2000).optional().describe('Free-text notes.'),
};

export const addManualTransactionTool = defineTool({
  name: 'finance_add_manual_transaction',
  backend: 'finance',
  config: {
    title: 'Add a manual transaction',
    description:
      'Record a transaction directly — a spoken/typed figure rather than something parsed from a CSV or ' +
      'PDF statement. Use finance_get_transactions first if there is any chance this transaction already ' +
      'exists, since this tool does not de-duplicate.',
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await createTransaction(http, args);
    const verb = transaction.type === 'Credit' ? 'Received' : transaction.type === 'Debit' ? 'Recorded' : 'Recorded transfer of';
    return textResult(
      `${verb} ${transaction.amount} ${transaction.currency} — "${transaction.description}" on ${transaction.transactionDate}. \`${transaction.id}\``,
      { transaction },
    );
  },
});
