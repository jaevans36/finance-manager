import { AxiosError } from 'axios';
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

jest.mock('../../../api/finance-accounts-api.js');
jest.mock('../../../api/finance-transactions-api.js');
jest.mock('../../../api/finance-bills-api.js');
jest.mock('../../../api/finance-pots-api.js');
jest.mock('../../../api/finance-goals-api.js');
jest.mock('../../../api/finance-affordability-api.js');
jest.mock('../../../api/finance-budgets-api.js');
jest.mock('../../../api/finance-income-api.js');
jest.mock('../../../api/finance-insights-api.js');

import * as accountsApi from '../../../api/finance-accounts-api.js';
import * as transactionsApi from '../../../api/finance-transactions-api.js';
import * as billsApi from '../../../api/finance-bills-api.js';
import * as potsApi from '../../../api/finance-pots-api.js';
import * as goalsApi from '../../../api/finance-goals-api.js';
import * as affordabilityApi from '../../../api/finance-affordability-api.js';
import * as budgetsApi from '../../../api/finance-budgets-api.js';
import * as incomeApi from '../../../api/finance-income-api.js';
import * as insightsApi from '../../../api/finance-insights-api.js';

import { getFinanceAccountsTool } from '../accounts/get-accounts.js';
import { updateAccountTool } from '../accounts/update-account.js';
import { checkAccountCompletenessTool } from '../accounts/check-account-completeness.js';
import { getFinanceTransactionsTool } from '../transactions/get-transactions.js';
import { addManualTransactionTool } from '../transactions/add-manual-transaction.js';
import { importTransactionsTool } from '../transactions/import-transactions.js';
import { importTransactionsJsonTool } from '../transactions/import-transactions-json.js';
import { searchTransactionsTool } from '../transactions/search-transactions.js';
import { categoriseTransactionTool } from '../transactions/categorise-transaction.js';
import { getBillsDueTool } from '../bills/get-bills-due.js';
import { getRecurringPaymentsTool } from '../bills/get-recurring-payments.js';
import { getPotBalancesTool } from '../pots/get-pot-balances.js';
import { updatePotBudgetTool } from '../pots/update-pot-budget.js';
import { getMonthlyBudgetSummaryTool } from '../budgets/get-monthly-budget-summary.js';
import { getSavingsGoalsTool } from '../goals/get-savings-goals.js';
import { updateSavingsGoalTool } from '../goals/update-savings-goal.js';
import { getDisposableIncomeTool } from '../affordability/get-disposable-income.js';
import { getIncomeSummaryTool } from '../income/get-income-summary.js';
import { getAiInsightsTool } from '../insights/get-ai-insights.js';
import type { AnyToolDef } from '../../_register.js';
import type { AccountSummary } from '../../../types/finance-account.js';
import type { CsvImportResult, TransactionDto } from '../../../types/finance-transaction.js';
import type { RecurringPattern } from '../../../types/finance-bill.js';
import type { BudgetWithProgress } from '../../../types/finance-budget.js';
import type { IncomeStream } from '../../../types/finance-income.js';
import type { InsightsSummaryResponse } from '../../../types/finance-insight.js';

const mockAccountsApi = accountsApi as jest.Mocked<typeof accountsApi>;
const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockBillsApi = billsApi as jest.Mocked<typeof billsApi>;
const mockPotsApi = potsApi as jest.Mocked<typeof potsApi>;
const mockGoalsApi = goalsApi as jest.Mocked<typeof goalsApi>;
const mockAffordabilityApi = affordabilityApi as jest.Mocked<typeof affordabilityApi>;
const mockBudgetsApi = budgetsApi as jest.Mocked<typeof budgetsApi>;
const mockIncomeApi = incomeApi as jest.Mocked<typeof incomeApi>;
const mockInsightsApi = insightsApi as jest.Mocked<typeof insightsApi>;

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

describe('finance_update_account', () => {
  it('forwards only the provided fields, not accountId', async () => {
    mockAccountsApi.updateFinanceAccount.mockResolvedValue({ ...account, balance: 500 });
    await updateAccountTool.handler({ accountId: UUID, balance: 500 }, ctx);
    expect(mockAccountsApi.updateFinanceAccount).toHaveBeenCalledWith(http, UUID, { balance: 500 });
  });

  it('accepts debt-specific fields', () => {
    const parsed = parse(updateAccountTool, {
      accountId: UUID,
      interestRate: 21.9,
      creditLimit: 3000,
      promotionalExpiry: '2027-01-01',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a missing accountId', () => {
    expect(parse(updateAccountTool, { balance: 100 }).success).toBe(false);
  });

  it('maps an API error to an isError result', async () => {
    mockAccountsApi.updateFinanceAccount.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await updateAccountTool.handler({ accountId: UUID, balance: 100 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_check_account_completeness', () => {
  it('reports nothing required for a non-debt account type', async () => {
    mockAccountsApi.getFinanceAccount.mockResolvedValue({ ...account, type: 'Checking' });
    const res = await checkAccountCompletenessTool.handler({ accountId: UUID }, ctx);
    expect(res.content[0].text).toContain('no debt fields are required');
    expect(res.structuredContent).toEqual({ account: { ...account, type: 'Checking' }, missing: [] });
  });

  it('lists missing fields for a credit account', async () => {
    mockAccountsApi.getFinanceAccount.mockResolvedValue({
      ...account,
      type: 'Credit',
      interestRate: null,
      creditLimit: 3000,
      minimumMonthlyPayment: null,
    });
    const res = await checkAccountCompletenessTool.handler({ accountId: UUID }, ctx);
    expect(res.content[0].text).toContain('interest rate');
    expect(res.content[0].text).toContain('minimum monthly payment');
    expect(res.content[0].text).not.toContain('credit limit — ');
    expect(res.structuredContent?.missing).toEqual(['interestRate', 'minimumMonthlyPayment']);
  });

  it('reports nothing missing when a debt account is fully filled in', async () => {
    mockAccountsApi.getFinanceAccount.mockResolvedValue({
      ...account,
      type: 'Credit',
      interestRate: 21.9,
      creditLimit: 3000,
      minimumMonthlyPayment: 50,
    });
    const res = await checkAccountCompletenessTool.handler({ accountId: UUID }, ctx);
    expect(res.content[0].text).toContain('has everything');
  });

  it('maps an API error to an isError result', async () => {
    mockAccountsApi.getFinanceAccount.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await checkAccountCompletenessTool.handler({ accountId: UUID }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_import_transactions', () => {
  const importResult: CsvImportResult = {
    imported: 2,
    duplicates: 1,
    errors: 0,
    errorMessages: [],
    batchId: 'batch-1',
    skipped: 0,
    skipMessages: null,
  };

  it('defaults bankFormat to generic', () => {
    const parsed = parse(importTransactionsTool, { accountId: UUID, csv: 'Date,Description,Amount\n01/01/2025,TESCO,-10' });
    expect(parsed.success && parsed.data.bankFormat).toBe('generic');
  });

  it('rejects an unknown bankFormat', () => {
    expect(parse(importTransactionsTool, { accountId: UUID, csv: 'x', bankFormat: 'made-up-bank' }).success).toBe(false);
  });

  it('forwards accountId, csv content, and bankFormat', async () => {
    mockTransactionsApi.importTransactionsCsv.mockResolvedValue(importResult);
    const csv = 'Date,Description,Amount\n01/01/2025,TESCO,-10';
    await importTransactionsTool.handler({ accountId: UUID, csv, bankFormat: 'barclays' }, ctx);
    expect(mockTransactionsApi.importTransactionsCsv).toHaveBeenCalledWith(http, UUID, csv, 'barclays');
  });

  it('reports imported, duplicate, and error counts', async () => {
    mockTransactionsApi.importTransactionsCsv.mockResolvedValue(importResult);
    const res = await importTransactionsTool.handler(
      { accountId: UUID, csv: 'Date,Description,Amount\n01/01/2025,TESCO,-10', bankFormat: 'generic' },
      ctx,
    );
    expect(res.content[0].text).toContain('Imported:** 2');
    expect(res.content[0].text).toContain('Duplicates skipped:** 1');
  });

  it('surfaces row-level error messages', async () => {
    mockTransactionsApi.importTransactionsCsv.mockResolvedValue({
      ...importResult,
      imported: 0,
      errors: 1,
      errorMessages: ['Row 2: could not parse amount'],
    });
    const res = await importTransactionsTool.handler(
      { accountId: UUID, csv: 'bad csv', bankFormat: 'generic' },
      ctx,
    );
    expect(res.content[0].text).toContain('could not parse amount');
  });

  it('maps an API error to an isError result', async () => {
    mockTransactionsApi.importTransactionsCsv.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await importTransactionsTool.handler(
      { accountId: UUID, csv: 'Date,Description,Amount\n01/01/2025,TESCO,-10', bankFormat: 'generic' },
      ctx,
    );
    expect(res.isError).toBe(true);
  });
});

describe('finance_import_transactions_json', () => {
  const importResult: CsvImportResult = {
    imported: 2,
    duplicates: 1,
    errors: 0,
    errorMessages: [],
    batchId: 'batch-1',
    skipped: 0,
    skipMessages: null,
  };

  it('requires at least one entry', () => {
    expect(parse(importTransactionsJsonTool, { accountId: UUID, entries: [] }).success).toBe(false);
    expect(
      parse(importTransactionsJsonTool, {
        accountId: UUID,
        entries: [{ transactionDate: '2026-09-10', description: 'Tesco', amount: 10, type: 'Debit' }],
      }).success,
    ).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(
      parse(importTransactionsJsonTool, {
        accountId: UUID,
        entries: [{ transactionDate: '2026-09-10', description: 'Tesco', amount: -10, type: 'Debit' }],
      }).success,
    ).toBe(false);
  });

  it('accepts category, payee, and notes on an entry', () => {
    const parsed = parse(importTransactionsJsonTool, {
      accountId: UUID,
      entries: [
        {
          transactionDate: '2026-09-10',
          description: 'AMZN MKTP UK',
          amount: 42.99,
          type: 'Debit',
          categoryId: UUID,
          payee: 'Amazon',
          notes: 'Birthday present',
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('forwards accountId and entries', async () => {
    mockTransactionsApi.importTransactionsJson.mockResolvedValue(importResult);
    const entries = [{ transactionDate: '2026-09-10', description: 'Tesco', amount: 10, type: 'Debit' as const }];
    await importTransactionsJsonTool.handler({ accountId: UUID, entries }, ctx);
    expect(mockTransactionsApi.importTransactionsJson).toHaveBeenCalledWith(http, UUID, entries);
  });

  it('reports imported, duplicate, and error counts', async () => {
    mockTransactionsApi.importTransactionsJson.mockResolvedValue(importResult);
    const res = await importTransactionsJsonTool.handler(
      { accountId: UUID, entries: [{ transactionDate: '2026-09-10', description: 'Tesco', amount: 10, type: 'Debit' }] },
      ctx,
    );
    expect(res.content[0].text).toContain('Imported:** 2');
    expect(res.content[0].text).toContain('Duplicates skipped:** 1');
  });

  it('surfaces entry-level skip messages', async () => {
    mockTransactionsApi.importTransactionsJson.mockResolvedValue({
      ...importResult,
      imported: 0,
      skipped: 1,
      skipMessages: ['Entry 1: description is required'],
    });
    const res = await importTransactionsJsonTool.handler(
      { accountId: UUID, entries: [{ transactionDate: '2026-09-10', description: 'x', amount: 10, type: 'Debit' }] },
      ctx,
    );
    expect(res.content[0].text).toContain('description is required');
  });

  it('maps an API error to an isError result', async () => {
    mockTransactionsApi.importTransactionsJson.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await importTransactionsJsonTool.handler(
      { accountId: UUID, entries: [{ transactionDate: '2026-09-10', description: 'Tesco', amount: 10, type: 'Debit' }] },
      ctx,
    );
    expect(res.isError).toBe(true);
  });
});

describe('finance_search_transactions', () => {
  it('requires a non-empty search term', () => {
    expect(parse(searchTransactionsTool, { accountId: UUID, search: 'Tesco' }).success).toBe(true);
    expect(parse(searchTransactionsTool, { accountId: UUID, search: '' }).success).toBe(false);
    expect(parse(searchTransactionsTool, { accountId: UUID }).success).toBe(false);
  });

  it('forwards the search term and renders results', async () => {
    mockTransactionsApi.listTransactions.mockResolvedValue({ items: [transaction], totalCount: 1, page: 1, pageSize: 50 });
    const res = await searchTransactionsTool.handler({ accountId: UUID, search: 'Tesco', page: 1, pageSize: 50 }, ctx);
    expect(mockTransactionsApi.listTransactions).toHaveBeenCalledWith(http, {
      accountId: UUID,
      search: 'Tesco',
      page: 1,
      pageSize: 50,
    });
    expect(res.content[0].text).toContain('Search results for "Tesco"');
    expect(res.content[0].text).toContain('Tesco');
  });

  it('maps an API error to an isError result', async () => {
    mockTransactionsApi.listTransactions.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await searchTransactionsTool.handler({ accountId: UUID, search: 'x', page: 1, pageSize: 50 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_categorise_transaction', () => {
  it('requires transactionId and categoryId as uuids', () => {
    expect(parse(categoriseTransactionTool, { transactionId: UUID, categoryId: UUID }).success).toBe(true);
    expect(parse(categoriseTransactionTool, { transactionId: 'not-a-uuid', categoryId: UUID }).success).toBe(false);
    expect(parse(categoriseTransactionTool, { transactionId: UUID }).success).toBe(false);
  });

  it('categorises the transaction and reports the new category', async () => {
    mockTransactionsApi.categoriseTransaction.mockResolvedValue({ ...transaction, categoryId: UUID, categoryName: 'Groceries' });
    const res = await categoriseTransactionTool.handler({ transactionId: 'txn-1', categoryId: UUID }, ctx);
    expect(mockTransactionsApi.categoriseTransaction).toHaveBeenCalledWith(http, 'txn-1', UUID);
    expect(res.content[0].text).toContain('Categorised "Tesco" as Groceries');
  });

  it('maps an API error to an isError result', async () => {
    mockTransactionsApi.categoriseTransaction.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await categoriseTransactionTool.handler({ transactionId: 'txn-1', categoryId: UUID }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_get_recurring_payments', () => {
  const pattern: RecurringPattern = {
    merchantName: 'Netflix',
    averageAmount: 15.99,
    latestAmount: 15.99,
    minAmount: 9.99,
    maxAmount: 15.99,
    detectedFrequency: 'Monthly',
    patternType: 'Subscription',
    amountTrend: 'Increasing',
    occurrencesInPeriod: 6,
    lastOccurrence: '2026-09-01',
    accountId: UUID,
    accountName: 'Current Account',
    isLikelyInactive: false,
  };

  it('defaults days to 365', () => {
    const parsed = parse(getRecurringPaymentsTool, {});
    expect(parsed.success && parsed.data.days).toBe(365);
  });

  it('rejects a days value above 730', () => {
    expect(parse(getRecurringPaymentsTool, { days: 731 }).success).toBe(false);
  });

  it('lists detected patterns, largest amount first', async () => {
    mockBillsApi.detectRecurringPayments.mockResolvedValue([pattern]);
    const res = await getRecurringPaymentsTool.handler({ days: 365 }, ctx);
    expect(mockBillsApi.detectRecurringPayments).toHaveBeenCalledWith(http, 365);
    expect(res.content[0].text).toContain('Netflix');
    expect(res.content[0].text).toContain('increasing');
  });

  it('maps an API error to an isError result', async () => {
    mockBillsApi.detectRecurringPayments.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getRecurringPaymentsTool.handler({ days: 365 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_update_pot_budget', () => {
  const pot = {
    id: UUID,
    name: 'Groceries',
    type: 'Groceries' as const,
    budgetAmount: 450,
    spent: 100,
    remaining: 350,
    rolloverEnabled: false,
    icon: null,
    colour: null,
    categoryIds: [],
    percentageUsed: 22,
    isWarning: false,
    isExceeded: false,
    annualAmount: null,
    nextPaymentDate: null,
    accumulatedAmount: 0,
    monthlyAllocation: null,
    monthsRemaining: null,
    isReady: false,
  };

  it('forwards only the provided fields, not potId', async () => {
    mockPotsApi.updatePot.mockResolvedValue(pot);
    await updatePotBudgetTool.handler({ potId: UUID, budgetAmount: 450 }, ctx);
    expect(mockPotsApi.updatePot).toHaveBeenCalledWith(http, UUID, { budgetAmount: 450 });
  });

  it('rejects a missing potId', () => {
    expect(parse(updatePotBudgetTool, { budgetAmount: 100 }).success).toBe(false);
  });

  it('reports the updated pot', async () => {
    mockPotsApi.updatePot.mockResolvedValue(pot);
    const res = await updatePotBudgetTool.handler({ potId: UUID, budgetAmount: 450 }, ctx);
    expect(res.content[0].text).toContain('Groceries');
    expect(res.content[0].text).toContain('450');
  });

  it('maps an API error to an isError result', async () => {
    mockPotsApi.updatePot.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await updatePotBudgetTool.handler({ potId: UUID, budgetAmount: 450 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_get_monthly_budget_summary', () => {
  const budget: BudgetWithProgress = {
    id: 'b1',
    categoryId: 'c1',
    categoryName: 'Groceries',
    categoryColour: null,
    categoryIcon: null,
    month: 9,
    year: 2026,
    amount: 400,
    spent: 350,
    rolloverFromPrevious: 0,
    percentageUsed: 87.5,
    isWarning: true,
    isExceeded: false,
    title: null,
    note: null,
  };

  it('renders a totalled summary above the per-category breakdown', async () => {
    mockBudgetsApi.getCurrentBudgets.mockResolvedValue([budget]);
    const res = await getMonthlyBudgetSummaryTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Total:');
    expect(res.content[0].text).toContain('£350.00 / £400.00');
    expect(res.content[0].text).toContain('Groceries');
    expect(res.content[0].text).toContain('warning');
  });

  it('renders an empty state', async () => {
    mockBudgetsApi.getCurrentBudgets.mockResolvedValue([]);
    const res = await getMonthlyBudgetSummaryTool.handler({}, ctx);
    expect(res.content[0].text).toContain('No budgets set');
  });

  it('maps an API error to an isError result', async () => {
    mockBudgetsApi.getCurrentBudgets.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getMonthlyBudgetSummaryTool.handler({}, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_get_income_summary', () => {
  const stream: IncomeStream = {
    id: 's1',
    userId: 'u1',
    name: 'Salary',
    monthlyAmount: 3000,
    accountId: UUID,
    accountName: 'Current Account',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('renders a totalled summary above the per-stream breakdown', async () => {
    mockIncomeApi.listIncomeStreams.mockResolvedValue([stream]);
    const res = await getIncomeSummaryTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Total monthly income:');
    expect(res.content[0].text).toContain('£3,000.00');
    expect(res.content[0].text).toContain('Salary');
  });

  it('renders an empty state', async () => {
    mockIncomeApi.listIncomeStreams.mockResolvedValue([]);
    const res = await getIncomeSummaryTool.handler({}, ctx);
    expect(res.content[0].text).toContain('No income streams');
  });

  it('maps an API error to an isError result', async () => {
    mockIncomeApi.listIncomeStreams.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getIncomeSummaryTool.handler({}, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_update_savings_goal', () => {
  const goal = {
    goal: {
      id: UUID,
      userId: 'u1',
      name: 'Holiday',
      targetAmount: 3000,
      currentAmount: 1000,
      targetDate: '2027-01-01',
      monthlyContribution: 200,
      status: 'Active' as const,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    percentageComplete: 33,
    monthsToTarget: 10,
    projectedCompletionDate: '2027-01-01',
    isOnTrack: true,
  };

  it('forwards only the provided fields, not goalId', async () => {
    mockGoalsApi.updateSavingsGoal.mockResolvedValue(goal);
    await updateSavingsGoalTool.handler({ goalId: UUID, targetAmount: 3000 }, ctx);
    expect(mockGoalsApi.updateSavingsGoal).toHaveBeenCalledWith(http, UUID, { targetAmount: 3000 });
  });

  it('rejects a non-positive targetAmount', () => {
    expect(parse(updateSavingsGoalTool, { goalId: UUID, targetAmount: 0 }).success).toBe(false);
  });

  it('reports the updated goal', async () => {
    mockGoalsApi.updateSavingsGoal.mockResolvedValue(goal);
    const res = await updateSavingsGoalTool.handler({ goalId: UUID, targetAmount: 3000 }, ctx);
    expect(res.content[0].text).toContain('Holiday');
  });

  it('maps an API error to an isError result', async () => {
    mockGoalsApi.updateSavingsGoal.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await updateSavingsGoalTool.handler({ goalId: UUID, targetAmount: 3000 }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('finance_get_ai_insights', () => {
  const summary: InsightsSummaryResponse = {
    cards: [
      {
        id: 'velocity',
        type: 'SpendingVelocity',
        severity: 'Warning',
        title: "You're on track to overspend this month",
        summary: '£500 spent in 10 days.',
        actionLabel: 'View breakdown',
      },
    ],
  };

  it('renders insight cards', async () => {
    mockInsightsApi.getInsightsSummary.mockResolvedValue(summary);
    const res = await getAiInsightsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('on track to overspend');
    expect(res.structuredContent).toEqual({ summary });
  });

  it('renders an empty state', async () => {
    mockInsightsApi.getInsightsSummary.mockResolvedValue({ cards: [] });
    const res = await getAiInsightsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('No insights right now');
  });

  it('maps an API error to an isError result', async () => {
    mockInsightsApi.getInsightsSummary.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await getAiInsightsTool.handler({}, ctx);
    expect(res.isError).toBe(true);
  });
});
