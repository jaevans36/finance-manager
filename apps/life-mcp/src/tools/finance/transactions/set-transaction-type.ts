import { z } from 'zod';
import { setTransactionType } from '../../../api/finance-transactions-api.js';
import { TRANSACTION_TYPES } from '../../../types/finance-transaction.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  transactionId: z.string().uuid().describe('Transaction to reclassify (from finance_get_transactions or finance_search_transactions).'),
  type: z.enum(TRANSACTION_TYPES).describe(
    'Debit, Credit, or Transfer. Use Transfer for internal movement between your own/household accounts ' +
      "(e.g. topping up a partner's account) so it's excluded from discretionary spend totals — safe in " +
      "either direction; relabelling a Credit or Debit as Transfer never changes the account's balance.",
  ),
};

export const setTransactionTypeTool = defineTool({
  name: 'finance_set_transaction_type',
  backend: 'finance',
  config: {
    title: "Set a transaction's type",
    description:
      "Reclassify a transaction as Debit, Credit, or Transfer — most commonly used to mark an internal " +
      'transfer (money moved between accounts you or your household control, not real income or spending) ' +
      "that was imported as a plain Debit/Credit. This never changes the account's actual balance, only how " +
      'the transaction is categorised for spend/income analysis.',
    inputSchema,
  },
  async handler(args, { http }) {
    const transaction = await setTransactionType(http, args.transactionId, args.type);
    return textResult(`Set "${transaction.description}" to ${transaction.type}.`, { transaction });
  },
});
