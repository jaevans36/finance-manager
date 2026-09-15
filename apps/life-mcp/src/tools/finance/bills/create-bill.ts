import { z } from 'zod';
import { createBill } from '../../../api/finance-bills-api.js';
import { BILL_FREQUENCIES } from '../../../types/finance-bill.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1).describe('Bill name, e.g. "British Gas".'),
  amount: z.number().positive(),
  frequency: z.enum(BILL_FREQUENCIES),
  dueDay: z.number().int().min(1).max(31).describe('Day of the month (1-31) the bill is due — or ISO day of week (1=Mon..7=Sun) when frequency is Weekly.'),
  reminderDaysBefore: z.number().int().min(0).describe('How many days before the due date to flag it as coming up in finance_get_bills_due.'),
  categoryId: z.string().uuid().optional().describe('Spending category (from finance_get_categories).'),
  description: z.string().optional(),
  accountId: z.string().uuid().optional().describe('Account this bill is paid from, if known (from finance_get_accounts) — lets the account\'s actual direct debit be checked against this amount.'),
};

export const createBillTool = defineTool({
  name: 'finance_create_bill',
  backend: 'finance',
  config: {
    title: 'Create a bill',
    description:
      'Register a recurring bill (utility, insurance, subscription, etc.) so it shows up in ' +
      'finance_get_bills_due and gets included in disposable-income calculations as a committed cost.',
    inputSchema,
  },
  async handler(args, { http }) {
    const bill = await createBill(http, args);
    return textResult(`Created bill "${bill.name}" — £${bill.amount} ${bill.frequency}, due day ${bill.dueDay}.`, { bill });
  },
});
