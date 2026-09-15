import { z } from 'zod';
import { detectRecurringPayments } from '../../../api/finance-bills-api.js';
import { formatRecurringPayments } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  days: z.number().int().min(1).max(730).default(365).describe('How far back to look for recurring patterns.'),
};

export const getRecurringPaymentsTool = defineTool({
  name: 'finance_get_recurring_payments',
  backend: 'finance',
  config: {
    title: 'Detect recurring payments and subscriptions',
    description:
      'Detect recurring payments and subscriptions from transaction history — e.g. "have I got any ' +
      'subscriptions I\'ve forgotten about?" Flags amount trends (increasing/decreasing) and patterns that ' +
      'look like they\'ve stopped recurring.',
    inputSchema,
  },
  async handler(args, { http }) {
    const patterns = await detectRecurringPayments(http, args.days);
    return textResult(formatRecurringPayments(patterns, '# Recurring Payments'), { patterns });
  },
});
