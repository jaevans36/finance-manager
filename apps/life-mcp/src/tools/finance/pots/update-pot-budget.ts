import { z } from 'zod';
import { updatePot } from '../../../api/finance-pots-api.js';
import { formatPotBalances } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  potId: z.string().uuid().describe('Pot to update (from finance_get_pot_balances).'),
  name: z.string().optional().describe('New pot name.'),
  budgetAmount: z.number().optional().describe('New monthly budget amount.'),
  rolloverEnabled: z.boolean().optional().describe('Whether unspent budget rolls over into next month.'),
  icon: z.string().optional(),
  colour: z.string().optional(),
  annualAmount: z.number().optional().describe('Annual target — sinking funds only.'),
  nextPaymentDate: z.string().optional().describe('ISO date of the next lumpy payment — sinking funds only.'),
};

export const updatePotBudgetTool = defineTool({
  name: 'finance_update_pot_budget',
  backend: 'finance',
  config: {
    title: 'Update a spending pot',
    description:
      "Update a spending pot's budget or settings — e.g. \"bump my Groceries budget up to £450\". Only the " +
      'fields you pass are changed.',
    inputSchema,
  },
  async handler(args, { http }) {
    const { potId, ...updates } = args;
    const pot = await updatePot(http, potId, updates);
    return textResult(formatPotBalances([pot], '# Updated'), { pot });
  },
});
