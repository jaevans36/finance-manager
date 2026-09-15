import { z } from 'zod';
import { detectIncome } from '../../../api/finance-income-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  accountId: z.string().uuid().describe('Account to scan recent credits in (from finance_get_accounts).'),
};

export const detectIncomeTool = defineTool({
  name: 'finance_detect_income',
  backend: 'finance',
  config: {
    title: 'Preview detected income for an account',
    description:
      "Preview the recurring credit amount finance-api's heuristics detect from an account's recent " +
      'transaction history — use before creating an income stream linked to that account, to suggest a ' +
      'sensible monthlyAmount rather than guessing.',
    inputSchema,
  },
  async handler(args, { http }) {
    const result = await detectIncome(http, args.accountId);
    const text =
      result.detectedMonthlyAmount === null
        ? `No recurring income pattern detected (${result.transactionCount} matching transaction(s)).`
        : `Detected ~£${result.detectedMonthlyAmount}/month from ${result.transactionCount} matching transaction(s).`;
    return textResult(text, { detected: result });
  },
});
