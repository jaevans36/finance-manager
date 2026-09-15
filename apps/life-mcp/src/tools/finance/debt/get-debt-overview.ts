import { getDebtOverview } from '../../../api/finance-debt-api.js';
import { defineTool, textResult } from '../../_register.js';

export const getDebtOverviewTool = defineTool({
  name: 'finance_get_debt_overview',
  backend: 'finance',
  config: {
    title: 'Get debt overview',
    description:
      'List every debt account (credit cards, loans, mortgages, and any overdrawn checking account) with balance, rate, minimum payment, a ' +
      'severity score/label, monthly interest cost, and months-to-payoff at the current payment — plus ' +
      'household totals. Use finance_check_account_completeness first on any account missing fields, since ' +
      'a debt with no interest rate or payment amount produces a hollow severity score. Use ' +
      'finance_get_debt_projection to model payoff strategies.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const overview = await getDebtOverview(http);
    const lines = [
      `# Debt overview`,
      `Total debt: £${overview.totalDebt} across ${overview.debts.length} account(s)`,
      `Total minimum payments: £${overview.totalMinimumPayments}/month · currently paying: £${overview.totalCurrentPayments}/month`,
      '',
      ...overview.debts.map(
        (d) =>
          `- **${d.name}** (${d.type}): £${d.balance} at ${d.interestRate ?? '?'}% — ${d.severityLabel}` +
          (d.monthsToPayoffAtCurrentPayment ? `, ${d.monthsToPayoffAtCurrentPayment}mo to payoff at current payment` : ''),
      ),
    ];
    return textResult(lines.join('\n'), { overview });
  },
});
