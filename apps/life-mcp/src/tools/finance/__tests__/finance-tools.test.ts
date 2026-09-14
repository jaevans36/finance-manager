import { AxiosError } from 'axios';
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

jest.mock('../../../api/finance-accounts-api.js');
jest.mock('../../../api/finance-transactions-api.js');
jest.mock('../../../api/finance-bills-api.js');
jest.mock('../../../api/finance-pots-api.js');
jest.mock('../../../api/finance-goals-api.js');
jest.mock('../../../api/finance-affordability-api.js');

import * as accountsApi from '../../../api/finance-accounts-api.js';
import * as transactionsApi from '../../../api/finance-transactions-api.js';
import * as billsApi from '../../../api/finance-bills-api.js';
import * as potsApi from '../../../api/finance-pots-api.js';
import * as goalsApi from '../../../api/finance-goals-api.js';
import * as affordabilityApi from '../../../api/finance-affordability-api.js';

import { getFinanceAccountsTool } from '../accounts/get-accounts.js';
import { getFinanceTransactionsTool } from '../transactions/get-transactions.js';
import { addManualTransactionTool } from '../transactions/add-manual-transaction.js';
import { getBillsDueTool } from '../bills/get-bills-due.js';
import { getPotBalancesTool } from '../pots/get-pot-balances.js';
import { getSavingsGoalsTool } from '../goals/get-savings-goals.js';
import { getDisposableIncomeTool } from '../affordability/get-disposable-income.js';
import type { AnyToolDef } from '../../_register.js';
import type { AccountSummary } from '../../../types/finance-account.js';
import type { TransactionDto } from '../../../types/finance-transaction.js';

const mockAccountsApi = accountsApi as jest.Mocked<typeof accountsApi>;
const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockBillsApi = billsApi as jest.Mocked<typeof billsApi>;
const mockPotsApi = potsApi as jest.Mocked<typeof potsApi>;
const mockGoalsApi = goalsApi as jest.Mocked<typeof goalsApi>;
const mockAffordabilityApi = affordabilityApi as jest.Mocked<typeof affordabilityApi>;

const http = {} as AxiosInstance;
const ctx = { http };

const UUID = '11111111-1111-1111-1111-111111111111';

function parse(def: AnyToolDef, input: unknown) {
  return z.object(def.config.inputSchema).safeParse(input);
}

const account: AccountSummary = {
  id: UUID,
  name: 'Current Account',
  type: 'Checking',
  currency: 'GBP',
  balance: 1234.56,
  institution: 'HSBC',
  colour: null,
  icon: null,
  isActive: true,
  excludeFromNetWorth: false,
  creditLimit: null,
  interestRate: null,
  promotionalBalance: null,
  promotionalRate: null,
  promotionalExpiry: null,
  promotionalRevertRate: null,
  mortgageStartDate: null,
  mortgageTermYears: null,
  isInterestOnly: false,
  minimumMonthlyPayment: null,
  currentMonthlyPayment: null,
  loanEndDate: null,
};

const transaction: TransactionDto = {
  id: 'txn-1',
  accountId: UUID,
  categoryId: null,
  categoryName: null,
  type: 'Debit',
  amount: 42.5,
  currency: 'GBP',
  description: 'Tesco',
  payee: 'Tesco',
  transactionDate: '2026-09-10',
  reference: null,
  isReviewed: false,
  isRecurring: false,
  isDuplicate: false,
  importSource: 'Manual',
  createdAt: '2026-09-10T00:00:00Z',
  notes: null,
};

describe('finance_get_accounts', () => {
  it('lists accounts', async () => {
    mockAccountsApi.listFinanceAccounts.mockResolvedValue([account]);
    const res = await getFinanceAccountsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Current Account');
    expect(res.structuredContent).toEqual({ accounts: [account] });
  });

  it('maps an API error to an isError result', async () => {
    mockAccountsApi.listFinanceAccounts.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getFinanceAccountsTool.handler({}, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_get_transactions', () => {
  it('requires a uuid accountId and defaults page/pageSize', () => {
    expect(parse(getFinanceTransactionsTool, { accountId: UUID }).success).toBe(true);
    const parsed = parse(getFinanceTransactionsTool, { accountId: UUID });
    expect(parsed.success && parsed.data.page).toBe(1);
    expect(parsed.success && parsed.data.pageSize).toBe(50);
    expect(parse(getFinanceTransactionsTool, { accountId: 'not-a-uuid' }).success).toBe(false);
    expect(parse(getFinanceTransactionsTool, {}).success).toBe(false);
  });

  it('rejects a pageSize above 200', () => {
    expect(parse(getFinanceTransactionsTool, { accountId: UUID, pageSize: 201 }).success).toBe(false);
  });

  it('forwards filters and renders pagination context', async () => {
    mockTransactionsApi.listTransactions.mockResolvedValue({
      items: [transaction],
      totalCount: 1,
      page: 1,
      pageSize: 50,
    });
    const res = await getFinanceTransactionsTool.handler(
      { accountId: UUID, from: '2026-09-01', to: '2026-09-30', page: 1, pageSize: 50 },
      ctx,
    );
    expect(mockTransactionsApi.listTransactions).toHaveBeenCalledWith(http, {
      accountId: UUID,
      from: '2026-09-01',
      to: '2026-09-30',
      page: 1,
      pageSize: 50,
    });
    expect(res.content[0].text).toContain('Tesco');
    expect(res.content[0].text).toContain('Page 1 of 1');
  });

  it('maps an API error to an isError result', async () => {
    mockTransactionsApi.listTransactions.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getFinanceTransactionsTool.handler({ accountId: UUID, page: 1, pageSize: 50 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_add_manual_transaction', () => {
  it('requires accountId, type, positive amount, description and transactionDate', () => {
    expect(
      parse(addManualTransactionTool, {
        accountId: UUID,
        type: 'Debit',
        amount: 10,
        description: 'Coffee',
        transactionDate: '2026-09-10',
      }).success,
    ).toBe(true);
    expect(parse(addManualTransactionTool, { accountId: UUID, type: 'Debit', amount: -5, description: 'x', transactionDate: '2026-09-10' }).success).toBe(false);
    expect(parse(addManualTransactionTool, { accountId: UUID, type: 'Bogus', amount: 5, description: 'x', transactionDate: '2026-09-10' }).success).toBe(false);
    expect(parse(addManualTransactionTool, { accountId: UUID }).success).toBe(false);
  });

  it('creates the transaction and reports it', async () => {
    mockTransactionsApi.createTransaction.mockResolvedValue(transaction);
    const res = await addManualTransactionTool.handler(
      { accountId: UUID, type: 'Debit', amount: 42.5, description: 'Tesco', transactionDate: '2026-09-10' },
      ctx,
    );
    expect(mockTransactionsApi.createTransaction).toHaveBeenCalledWith(http, {
      accountId: UUID,
      type: 'Debit',
      amount: 42.5,
      description: 'Tesco',
      transactionDate: '2026-09-10',
    });
    expect(res.content[0].text).toContain('Recorded');
    expect(res.content[0].text).toContain('txn-1');
  });

  it('describes a Credit as received', async () => {
    mockTransactionsApi.createTransaction.mockResolvedValue({ ...transaction, type: 'Credit' });
    const res = await addManualTransactionTool.handler(
      { accountId: UUID, type: 'Credit', amount: 42.5, description: 'Salary', transactionDate: '2026-09-10' },
      ctx,
    );
    expect(res.content[0].text).toContain('Received');
  });

  it('maps a validation error to an isError result', async () => {
    const err = new AxiosError('bad request', '400', undefined, undefined, {
      status: 400,
      data: { error: { message: 'Amount must be positive' } },
    } as never);
    mockTransactionsApi.createTransaction.mockRejectedValue(err);
    const res = await addManualTransactionTool.handler(
      { accountId: UUID, type: 'Debit', amount: 1, description: 'x', transactionDate: '2026-09-10' },
      ctx,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Amount must be positive');
  });
});

describe('finance_get_bills_due', () => {
  it('defaults days to 30', () => {
    const parsed = parse(getBillsDueTool, {});
    expect(parsed.success && parsed.data.days).toBe(30);
  });

  it('rejects a days value above 365', () => {
    expect(parse(getBillsDueTool, { days: 366 }).success).toBe(false);
  });

  it('lists upcoming bills soonest-first', async () => {
    mockBillsApi.getUpcomingBills.mockResolvedValue([
      {
        bill: {
          id: 'b1',
          userId: 'u1',
          name: 'Council Tax',
          description: null,
          amount: 150,
          frequency: 'Monthly',
          dueDay: 1,
          reminderDaysBefore: 5,
          isPaid: false,
          lastPaidDate: null,
          categoryId: null,
          categoryName: null,
          isActive: true,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          accountId: null,
          accountName: null,
          linkedAccountPayment: null,
          hasPaymentMismatch: false,
        },
        nextDueDate: '2026-10-01',
        daysUntilDue: 17,
        isReminderDue: false,
      },
    ]);
    const res = await getBillsDueTool.handler({ days: 30 }, ctx);
    expect(mockBillsApi.getUpcomingBills).toHaveBeenCalledWith(http, 30);
    expect(res.content[0].text).toContain('Council Tax');
  });
});

describe('finance_get_pot_balances', () => {
  it('accepts an optional month/year and passes them through', async () => {
    mockPotsApi.getPotBalances.mockResolvedValue([]);
    await getPotBalancesTool.handler({ month: 9, year: 2026 }, ctx);
    expect(mockPotsApi.getPotBalances).toHaveBeenCalledWith(http, { month: 9, year: 2026 });
  });

  it('rejects a month outside 1-12', () => {
    expect(parse(getPotBalancesTool, { month: 13 }).success).toBe(false);
  });

  it('renders an empty state', async () => {
    mockPotsApi.getPotBalances.mockResolvedValue([]);
    const res = await getPotBalancesTool.handler({}, ctx);
    expect(res.content[0].text).toContain('No spending pots');
  });
});

describe('finance_get_savings_goals', () => {
  it('lists goals with projection', async () => {
    mockGoalsApi.listSavingsGoals.mockResolvedValue([
      {
        goal: {
          id: 'g1',
          userId: 'u1',
          name: 'Emergency Fund',
          targetAmount: 5000,
          currentAmount: 2000,
          targetDate: '2027-01-01',
          monthlyContribution: 200,
          status: 'Active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        percentageComplete: 40,
        monthsToTarget: 15,
        projectedCompletionDate: '2027-06-01',
        isOnTrack: false,
      },
    ]);
    const res = await getSavingsGoalsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Emergency Fund');
    expect(res.content[0].text).toContain('behind target');
  });
});

describe('finance_get_disposable_income', () => {
  it('renders the affordability breakdown', async () => {
    mockAffordabilityApi.getAffordability.mockResolvedValue({
      monthlyIncome: 3000,
      incomeConfidence: 'High',
      incomeSource: 'Detected',
      committedCosts: 1200,
      existingDebtPayments: 300,
      discretionarySpend: 600,
      plannedSavings: 400,
      emergencyBuffer: 200,
      safeSurplus: 300,
      suggestedDebtPayment: 150,
      calculatedAt: '2026-09-14',
      incomeAccountIds: [UUID],
    });
    const res = await getDisposableIncomeTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Disposable Income');
    expect(res.content[0].text).toContain('Safe surplus');
  });

  it('maps an API error to an isError result', async () => {
    mockAffordabilityApi.getAffordability.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getDisposableIncomeTool.handler({}, ctx);
    expect(res.isError).toBe(true);
  });
});
