import { z } from 'zod';
import { getDebtProjection } from '../../../api/finance-debt-api.js';
import { DEBT_STRATEGIES } from '../../../types/finance-debt.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  strategy: z
    .enum(DEBT_STRATEGIES)
    .describe('Avalanche = highest interest rate first (minimises total interest). Snowball = smallest balance first (fastest wins for motivation). Custom = use customAllocations.'),
  extraMonthlyPayment: z.number().min(0).optional().describe('Extra amount beyond minimums to put toward debt each month, on top of whatever surplus finance_get_disposable_income suggests.'),
  customAllocations: z
    .array(z.object({ accountId: z.string().uuid(), monthlyPayment: z.number().min(0) }))
    .optional()
    .describe('Required when strategy is Custom — an explicit monthly payment per account.'),
  excludedAccountIds: z.array(z.string().uuid()).optional().describe('Debt accounts to leave out of the projection entirely (e.g. a 0% promo card not worth rushing).'),
};

export const getDebtProjectionTool = defineTool({
  name: 'finance_get_debt_projection',
  backend: 'finance',
  config: {
    title: 'Project a debt payoff strategy',
    description:
      'Model a debt payoff plan — avalanche, snowball, or a custom per-account allocation — and get back ' +
      'months-to-freedom, total interest paid, a month-by-month schedule, and the order debts get paid off in. ' +
      'Run this with a few different strategies/extra-payment amounts to compare before recommending one.',
    inputSchema,
  },
  async handler(args, { http }) {
    const projection = await getDebtProjection(http, args);
    const lines = [
      `# ${projection.strategy} projection`,
      `${projection.monthsToFreedom} months to debt-free (${projection.estimatedFreedomDate}) — £${projection.totalInterestPaid} total interest`,
      '',
      '## Payoff order',
      ...projection.payoffOrder.map((p) => `- ${p.name}: paid off month ${p.monthPaidOff} (${p.paidOffDate})`),
      ...(projection.warnings.length > 0 ? ['', '## Warnings', ...projection.warnings.map((w) => `- ${w}`)] : []),
    ];
    return textResult(lines.join('\n'), { projection });
  },
});
