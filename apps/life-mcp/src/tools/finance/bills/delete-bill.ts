import { z } from 'zod';
import { deleteBill } from '../../../api/finance-bills-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  billId: z.string().uuid().describe('Bill to delete (from finance_get_bills).'),
};

export const deleteBillTool = defineTool({
  name: 'finance_delete_bill',
  backend: 'finance',
  config: {
    title: 'Delete a bill',
    description: 'Permanently delete a bill. For a bill that has simply ended, prefer finance_update_bill with isActive: false to keep its history.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteBill(http, args.billId);
    return textResult(`Deleted bill ${args.billId}.`);
  },
});
