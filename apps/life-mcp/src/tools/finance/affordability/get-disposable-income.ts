import { getAffordability } from '../../../api/finance-affordability-api.js';
import { formatAffordability } from '../../../utils/format.js';
import { defineTool, textResult } from '../../_register.js';

export const getDisposableIncomeTool = defineTool({
  name: 'finance_get_disposable_income',
  backend: 'finance',
  config: {
    title: 'Get disposable income breakdown',
    description:
      "Get the current user's monthly disposable income breakdown — income, committed costs, existing debt " +
      'payments, discretionary spend, planned savings, emergency buffer, and the resulting safe surplus.',
    inputSchema: {},
  },
  async handler(_args, { http }) {
    const affordability = await getAffordability(http);
    return textResult(formatAffordability(affordability), { affordability });
  },
});
