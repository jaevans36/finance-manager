import { z } from 'zod';
import { getUpcomingBills } from '../../../api/finance-bills-api.js';
import { formatUpcomingBills } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  days: z.number().int().min(1).max(365).default(30).describe('How many days ahead to look (default 30).'),
};

export const getBillsDueTool = defineTool({
  name: 'finance_get_bills_due',
  backend: 'finance',
  config: {
    title: 'List bills due soon',
    description: 'List upcoming bills within the given window, soonest first, flagging any reminder that is due or payment amount mismatch.',
    inputSchema,
  },
  async handler(args, { http }) {
    const bills = await getUpcomingBills(http, args.days);
    return textResult(formatUpcomingBills(bills, `# Bills due in the next ${args.days} days`), { bills });
  },
});
