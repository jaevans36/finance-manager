import { z } from 'zod';
import { getPotBalances } from '../../../api/finance-pots-api.js';
import { formatPotBalances } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  month: z.number().int().min(1).max(12).optional().describe('Month (1-12) — defaults to the current month.'),
  year: z.number().int().min(2000).optional().describe('Year — defaults to the current year.'),
};

export const getPotBalancesTool = defineTool({
  name: 'finance_get_pot_balances',
  backend: 'finance',
  config: {
    title: 'Get spending pot balances',
    description: 'Get spending pot (envelope budget) balances for a month — budgeted vs spent vs remaining, and whether each is on track.',
    inputSchema,
  },
  async handler(args, { http }) {
    const pots = await getPotBalances(http, args);
    return textResult(formatPotBalances(pots, '# Spending Pots'), { pots });
  },
});
