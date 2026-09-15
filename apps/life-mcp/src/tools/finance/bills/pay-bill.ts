import { z } from 'zod';
import { markBillPaid } from '../../../api/finance-bills-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  billId: z.string().uuid().describe('Bill to mark as paid (from finance_get_bills or finance_get_bills_due).'),
};

export const payBillTool = defineTool({
  name: 'finance_pay_bill',
  backend: 'finance',
  config: {
    title: 'Mark a bill as paid',
    description: "Mark a bill as paid for the current period, clearing it from finance_get_bills_due until its next due date.",
    inputSchema,
  },
  async handler(args, { http }) {
    await markBillPaid(http, args.billId);
    return textResult(`Marked bill ${args.billId} as paid.`);
  },
});
