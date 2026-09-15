import { z } from 'zod';
import { updateBill } from '../../../api/finance-bills-api.js';
import { BILL_FREQUENCIES } from '../../../types/finance-bill.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  billId: z.string().uuid().describe('Bill to update (from finance_get_bills).'),
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional().describe('New amount — e.g. after a price rise.'),
  frequency: z.enum(BILL_FREQUENCIES).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  reminderDaysBefore: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional().describe('Set false to stop tracking a cancelled bill without deleting its history.'),
  description: z.string().optional(),
  accountId: z.string().uuid().optional(),
};

export const updateBillTool = defineTool({
  name: 'finance_update_bill',
  backend: 'finance',
  config: {
    title: 'Update a bill',
    description: "Update a bill's amount, frequency, due day, category, or active status. Only the fields passed are changed.",
    inputSchema,
  },
  async handler(args, { http }) {
    const { billId, ...updates } = args;
    const bill = await updateBill(http, billId, updates);
    return textResult(`Updated "${bill.name}" — now £${bill.amount} ${bill.frequency}.`, { bill });
  },
});
