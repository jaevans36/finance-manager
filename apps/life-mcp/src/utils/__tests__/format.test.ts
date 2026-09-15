import type { EventDto } from '../../types/event.js';
import type { TaskDto } from '../../types/task.js';
import type { AccountSummary } from '../../types/finance-account.js';
import type { AffordabilityResponse } from '../../types/finance-affordability.js';
import type { UpcomingBillResponse } from '../../types/finance-bill.js';
import type { SavingsGoalWithProjection } from '../../types/finance-goal.js';
import type { SpendingPotWithProgress } from '../../types/finance-pot.js';
import type { PagedResult, TransactionDto } from '../../types/finance-transaction.js';
import {
  formatAccountList,
  formatAffordability,
  formatEventDetail,
  formatEventList,
  formatLabelList,
  formatPotBalances,
  formatSavingsGoals,
  formatTaskDetail,
  formatTaskList,
  formatTransactionList,
  formatUpcomingBills,
} from '../format.js';
import { daysBetween, isoDate, startOfDay } from '../format-date.js';

function event(overrides: Partial<EventDto> = {}): EventDto {
  return {
    id: 'e1',
    userId: 'u1',
    title: 'Standup',
    description: null,
    startDate: '2026-09-11T09:00:00',
    endDate: '2026-09-11T09:15:00',
    isAllDay: false,
    location: null,
    reminderMinutes: null,
    groupId: null,
    groupName: null,
    groupColour: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    isOwner: true,
    sharedBy: null,
    myPermission: null,
    ...overrides,
  };
}

function task(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: 't1',
    title: 'A task',
    description: null,
    priority: 'Medium',
    dueDate: null,
    completed: false,
    completedAt: null,
    status: 'NotStarted',
    startedAt: null,
    blockedReason: null,
    urgency: null,
    importance: null,
    quadrant: null,
    energyLevel: null,
    estimatedMinutes: null,
    groupId: null,
    groupName: null,
    groupColour: null,
    parentTaskId: null,
    hasSubtasks: false,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    progressPercentage: 0,
    subtasks: [],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    isOwner: true,
    assignedTo: null,
    assignedBy: null,
    reminderAt: null,
    labels: [],
    ...overrides,
  };
}

describe('formatTaskList', () => {
  it('renders an empty list with a friendly line', () => {
    expect(formatTaskList([])).toContain('_No tasks._');
  });

  it('sorts Critical before Low regardless of input order', () => {
    const out = formatTaskList([
      task({ id: 'low', title: 'low one', priority: 'Low' }),
      task({ id: 'crit', title: 'crit one', priority: 'Critical' }),
    ]);
    expect(out.indexOf('crit one')).toBeLessThan(out.indexOf('low one'));
  });

  it('shows a checked box for completed tasks and includes the id', () => {
    const out = formatTaskList([task({ completed: true })]);
    expect(out).toContain('- [x] A task');
    expect(out).toContain('`t1`');
  });
});

describe('formatTaskDetail', () => {
  it('includes description and subtasks when present', () => {
    const out = formatTaskDetail(
      task({
        description: 'do the thing',
        hasSubtasks: true,
        subtaskCount: 1,
        subtasks: [{ ...task({ id: 's1', title: 'step one' }) }],
      }),
    );
    expect(out).toContain('## Description');
    expect(out).toContain('do the thing');
    expect(out).toContain('- [ ] step one');
  });
});

describe('formatEventList', () => {
  it('groups by day and shows a time range', () => {
    const out = formatEventList([
      event({ id: 'a', title: 'Morning', startDate: '2026-09-11T09:00:00', endDate: '2026-09-11T10:00:00' }),
      event({ id: 'b', title: 'Next day', startDate: '2026-09-12T14:00:00', endDate: '2026-09-12T15:00:00' }),
    ]);
    expect(out).toContain('### 2026-09-11');
    expect(out).toContain('### 2026-09-12');
    expect(out).toMatch(/09:00–10:00\s+Morning/);
  });

  it('renders all-day events and an empty list', () => {
    expect(formatEventList([event({ isAllDay: true })])).toContain('All day');
    expect(formatEventList([])).toContain('_No events._');
  });
});

describe('formatEventDetail', () => {
  it('includes location, reminder and description when present', () => {
    const out = formatEventDetail(
      event({ location: 'Room 2', reminderMinutes: 15, description: 'daily sync' }),
    );
    expect(out).toContain('# Standup');
    expect(out).toContain('Room 2');
    expect(out).toContain('15 min before');
    expect(out).toContain('daily sync');
  });
});

describe('formatLabelList', () => {
  it('lists labels and handles the empty case', () => {
    expect(formatLabelList([{ id: 'l1', name: 'Home', colourHex: '#21B8A4' }])).toContain('Home — `#21B8A4`');
    expect(formatLabelList([])).toContain('_No labels defined._');
  });
});

function account(overrides: Partial<AccountSummary> = {}): AccountSummary {
  return {
    id: 'a1',
    name: 'Current Account',
    type: 'Checking',
    currency: 'GBP',
    balance: 100,
    institution: null,
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
    ...overrides,
  };
}

function transaction(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: 't1',
    accountId: 'a1',
    categoryId: null,
    categoryName: null,
    type: 'Debit',
    amount: 10,
    currency: 'GBP',
    description: 'Coffee',
    payee: null,
    transactionDate: '2026-09-10',
    reference: null,
    isReviewed: false,
    isRecurring: false,
    isDuplicate: false,
    importSource: 'Manual',
    createdAt: '2026-09-10T00:00:00Z',
    notes: null,
    incomeStreamId: null,
    incomeStreamName: null,
    ...overrides,
  };
}

describe('formatAccountList', () => {
  it('renders balance with currency and flags inactive accounts', () => {
    const out = formatAccountList([account({ balance: 1234.56 }), account({ id: 'a2', isActive: false })]);
    expect(out).toContain('£1,234.56');
    expect(out).toContain('inactive');
  });

  it('renders an empty list with a friendly line', () => {
    expect(formatAccountList([])).toContain('_No accounts._');
  });
});

describe('formatTransactionList', () => {
  it('sorts newest first and includes pagination context', () => {
    const page: PagedResult<TransactionDto> = {
      items: [
        transaction({ id: 'old', transactionDate: '2026-09-01', description: 'old one' }),
        transaction({ id: 'new', transactionDate: '2026-09-10', description: 'new one' }),
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
    };
    const out = formatTransactionList(page);
    expect(out.indexOf('new one')).toBeLessThan(out.indexOf('old one'));
    expect(out).toContain('Page 1 of 1 (2 total)');
  });

  it('shows a duplicate flag and an empty state', () => {
    expect(
      formatTransactionList({ items: [transaction({ isDuplicate: true })], totalCount: 1, page: 1, pageSize: 50 }),
    ).toContain('possible duplicate');
    expect(formatTransactionList({ items: [], totalCount: 0, page: 1, pageSize: 50 })).toContain('_No transactions._');
  });
});

describe('formatUpcomingBills', () => {
  function bill(overrides: Partial<UpcomingBillResponse> = {}): UpcomingBillResponse {
    return {
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
      ...overrides,
    };
  }

  it('sorts soonest-due first', () => {
    const out = formatUpcomingBills([
      bill({ bill: { ...bill().bill, id: 'far', name: 'Far bill' }, daysUntilDue: 20 }),
      bill({ bill: { ...bill().bill, id: 'soon', name: 'Soon bill' }, daysUntilDue: 2 }),
    ]);
    expect(out.indexOf('Soon bill')).toBeLessThan(out.indexOf('Far bill'));
  });

  it('flags a due reminder and payment mismatch', () => {
    const out = formatUpcomingBills([
      bill({ isReminderDue: true, bill: { ...bill().bill, hasPaymentMismatch: true } }),
    ]);
    expect(out).toContain('reminder due');
    expect(out).toContain('payment mismatch');
  });

  it('renders an empty state', () => {
    expect(formatUpcomingBills([])).toContain('_No bills due._');
  });
});

describe('formatPotBalances', () => {
  function pot(overrides: Partial<SpendingPotWithProgress> = {}): SpendingPotWithProgress {
    return {
      id: 'p1',
      name: 'Groceries',
      type: 'Groceries',
      budgetAmount: 300,
      spent: 100,
      remaining: 200,
      rolloverEnabled: false,
      icon: null,
      colour: null,
      categoryIds: [],
      percentageUsed: 33,
      isWarning: false,
      isExceeded: false,
      annualAmount: null,
      nextPaymentDate: null,
      accumulatedAmount: 0,
      monthlyAllocation: null,
      monthsRemaining: null,
      isReady: false,
      ...overrides,
    };
  }

  it('flags exceeded and warning pots', () => {
    expect(formatPotBalances([pot({ isExceeded: true })])).toContain('exceeded');
    expect(formatPotBalances([pot({ isWarning: true })])).toContain('warning');
  });

  it('renders an empty state', () => {
    expect(formatPotBalances([])).toContain('_No spending pots._');
  });
});

describe('formatSavingsGoals', () => {
  function goal(overrides: Partial<SavingsGoalWithProjection['goal']> = {}, projOverrides: Partial<SavingsGoalWithProjection> = {}): SavingsGoalWithProjection {
    return {
      goal: {
        id: 'g1',
        userId: 'u1',
        name: 'Emergency Fund',
        targetAmount: 5000,
        currentAmount: 2000,
        targetDate: null,
        monthlyContribution: 200,
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
      },
      percentageComplete: 40,
      monthsToTarget: 15,
      projectedCompletionDate: null,
      isOnTrack: true,
      ...projOverrides,
    };
  }

  it('flags an active goal that is behind target', () => {
    expect(formatSavingsGoals([goal({}, { isOnTrack: false })])).toContain('behind target');
  });

  it('does not flag an achieved goal as behind target even if isOnTrack is false', () => {
    const out = formatSavingsGoals([goal({ status: 'Achieved' }, { isOnTrack: false })]);
    expect(out).not.toContain('behind target');
  });

  it('renders an empty state', () => {
    expect(formatSavingsGoals([])).toContain('_No savings goals._');
  });
});

describe('formatAffordability', () => {
  it('includes every headline figure', () => {
    const out = formatAffordability({
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
      incomeAccountIds: [],
    } satisfies AffordabilityResponse);
    expect(out).toContain('# Disposable Income');
    expect(out).toContain('£3,000.00');
    expect(out).toContain('Safe surplus');
  });
});

describe('format-date helpers', () => {
  it('isoDate returns YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-09-07T13:00:00'))).toBe('2026-09-07');
  });

  it('startOfDay zeroes the time', () => {
    const d = startOfDay(new Date('2026-09-07T13:45:12'));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('daysBetween floors to whole local days and never goes negative', () => {
    expect(daysBetween(new Date('2026-09-01T23:00:00'), new Date('2026-09-04T01:00:00'))).toBe(3);
    expect(daysBetween(new Date('2026-09-04'), new Date('2026-09-01'))).toBe(0);
  });
});
