import type { EventDto } from '../types/event.js';
import type { LabelDto } from '../types/label.js';
import type { Priority, TaskDto } from '../types/task.js';
import type { AccountSummary } from '../types/finance-account.js';
import type { AffordabilityResponse } from '../types/finance-affordability.js';
import type { UpcomingBillResponse } from '../types/finance-bill.js';
import type { SavingsGoalWithProjection } from '../types/finance-goal.js';
import type { SpendingPotWithProgress } from '../types/finance-pot.js';
import type { PagedResult, TransactionDto } from '../types/finance-transaction.js';

const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function priorityRank(p: Priority | null): number {
  return p ? PRIORITY_ORDER[p] : 4;
}

function taskLine(t: TaskDto): string {
  const box = t.completed || t.status === 'Completed' ? '[x]' : '[ ]';
  const bits: string[] = [`- ${box} ${t.title}`];
  const meta: string[] = [];
  if (t.priority) meta.push(t.priority);
  if (t.dueDate) meta.push(`due ${t.dueDate.slice(0, 10)}`);
  if (t.status && t.status !== 'NotStarted' && t.status !== 'Completed') meta.push(t.status);
  if (t.labels.length > 0) meta.push(t.labels.map((l) => `#${l.name}`).join(' '));
  if (t.hasSubtasks) meta.push(`${t.completedSubtaskCount}/${t.subtaskCount} subtasks`);
  if (meta.length > 0) bits.push(`  _(${meta.join(' · ')})_`);
  bits.push(`  \`${t.id}\``);
  return bits.join('');
}

/** A flat markdown checklist, sorted by priority then due date. */
export function formatTaskList(tasks: TaskDto[], heading?: string): string {
  const sorted = [...tasks].sort((a, b) => {
    const p = priorityRank(a.priority) - priorityRank(b.priority);
    if (p !== 0) return p;
    return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  });
  const body = sorted.length === 0 ? '_No tasks._' : sorted.map(taskLine).join('\n');
  return heading ? `${heading}\n\n${body}` : body;
}

/** Full detail for a single task, including subtasks and labels. */
export function formatTaskDetail(t: TaskDto): string {
  const lines: string[] = [`# ${t.title}`, ''];
  lines.push(`- **ID:** \`${t.id}\``);
  lines.push(`- **Status:** ${t.status}${t.completed ? ' (completed)' : ''}`);
  if (t.priority) lines.push(`- **Priority:** ${t.priority}`);
  if (t.dueDate) lines.push(`- **Due:** ${t.dueDate}`);
  if (t.reminderAt) lines.push(`- **Reminder:** ${t.reminderAt}`);
  if (t.energyLevel) lines.push(`- **Energy:** ${t.energyLevel}`);
  if (t.estimatedMinutes != null) lines.push(`- **Estimate:** ${t.estimatedMinutes} min`);
  if (t.groupName) lines.push(`- **Group:** ${t.groupName}`);
  if (t.blockedReason) lines.push(`- **Blocked:** ${t.blockedReason}`);
  if (t.assignedTo) lines.push(`- **Assigned to:** ${t.assignedTo.username}`);
  if (t.labels.length > 0) lines.push(`- **Labels:** ${t.labels.map((l) => l.name).join(', ')}`);
  if (t.description) {
    lines.push('', '## Description', '', t.description);
  }
  const subs = t.subtasks ?? [];
  if (subs.length > 0) {
    lines.push('', '## Subtasks', '');
    for (const s of subs) {
      lines.push(`- ${s.completed || s.status === 'Completed' ? '[x]' : '[ ]'} ${s.title} \`${s.id}\``);
    }
  } else if (t.hasSubtasks) {
    lines.push('', `_${t.completedSubtaskCount}/${t.subtaskCount} subtasks (not expanded — pass includeSubtasks)_`);
  }
  return lines.join('\n');
}

// ── Events ────────────────────────────────────────────────────────────────────

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function eventLine(e: EventDto): string {
  const when = e.isAllDay ? 'All day' : `${hhmm(e.startDate)}–${hhmm(e.endDate)}`;
  const where = e.location ? ` @ ${e.location}` : '';
  return `- ${when}  ${e.title}${where}  \`${e.id}\``;
}

/** Events grouped by local start date, chronological. */
export function formatEventList(events: EventDto[], heading?: string): string {
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let body: string;
  if (sorted.length === 0) {
    body = '_No events._';
  } else {
    const byDay = new Map<string, EventDto[]>();
    for (const e of sorted) {
      const day = e.startDate.slice(0, 10);
      const bucket = byDay.get(day) ?? [];
      bucket.push(e);
      byDay.set(day, bucket);
    }
    body = [...byDay.entries()]
      .map(([day, evs]) => `### ${day}\n${evs.map(eventLine).join('\n')}`)
      .join('\n\n');
  }
  return heading ? `${heading}\n\n${body}` : body;
}

/** Full detail for a single event. */
export function formatEventDetail(e: EventDto): string {
  const lines: string[] = [`# ${e.title}`, ''];
  lines.push(`- **ID:** \`${e.id}\``);
  lines.push(`- **Start:** ${e.startDate}`);
  lines.push(`- **End:** ${e.endDate}`);
  if (e.isAllDay) lines.push('- **All day:** yes');
  if (e.location) lines.push(`- **Location:** ${e.location}`);
  if (e.reminderMinutes != null) lines.push(`- **Reminder:** ${e.reminderMinutes} min before`);
  if (e.groupName) lines.push(`- **Group:** ${e.groupName}`);
  if (e.sharedBy) lines.push(`- **Shared by:** ${e.sharedBy.username} (${e.myPermission ?? 'view'})`);
  if (e.description) lines.push('', '## Description', '', e.description);
  return lines.join('\n');
}

// ── Labels ────────────────────────────────────────────────────────────────────

export function formatLabelList(labels: LabelDto[]): string {
  if (labels.length === 0) return '_No labels defined._';
  return labels.map((l) => `- ${l.name} — \`${l.colourHex}\`  \`${l.id}\``).join('\n');
}

// ── Finance ───────────────────────────────────────────────────────────────────

/** £-style formatting for a given ISO currency code; falls back gracefully for unknown codes. */
function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function accountLine(a: AccountSummary): string {
  const bits: string[] = [`- ${a.name} (${a.type})`, `${money(a.balance, a.currency)}`];
  if (a.institution) bits.push(a.institution);
  if (!a.isActive) bits.push('inactive');
  return `${bits.slice(0, 2).join('  ')}${bits.length > 2 ? `  _(${bits.slice(2).join(' · ')})_` : ''}  \`${a.id}\``;
}

/** A flat markdown list of accounts. */
export function formatAccountList(accounts: AccountSummary[], heading?: string): string {
  const body = accounts.length === 0 ? '_No accounts._' : accounts.map(accountLine).join('\n');
  return heading ? `${heading}\n\n${body}` : body;
}

function transactionLine(t: TransactionDto): string {
  const sign = t.type === 'Credit' ? '+' : t.type === 'Debit' ? '-' : '';
  const bits: string[] = [`- ${t.transactionDate}  ${sign}${money(Math.abs(t.amount), t.currency)}  ${t.description}`];
  const meta: string[] = [];
  if (t.payee) meta.push(t.payee);
  if (t.categoryName) meta.push(t.categoryName);
  if (t.isDuplicate) meta.push('possible duplicate');
  if (meta.length > 0) bits.push(`  _(${meta.join(' · ')})_`);
  bits.push(`  \`${t.id}\``);
  return bits.join('');
}

/** A flat markdown list of transactions, newest first, with pagination context in the heading. */
export function formatTransactionList(page: PagedResult<TransactionDto>, heading?: string): string {
  const sorted = [...page.items].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  const body = sorted.length === 0 ? '_No transactions._' : sorted.map(transactionLine).join('\n');
  const pageInfo = `Page ${page.page} of ${Math.max(1, Math.ceil(page.totalCount / page.pageSize))} (${page.totalCount} total)`;
  const full = heading ? `${heading} — ${pageInfo}\n\n${body}` : `${pageInfo}\n\n${body}`;
  return full;
}

function upcomingBillLine(u: UpcomingBillResponse): string {
  const bits: string[] = [
    `- ${u.bill.name}  ${money(u.bill.amount, 'GBP')}  due ${u.nextDueDate.slice(0, 10)} (${u.daysUntilDue}d)`,
  ];
  const meta: string[] = [];
  if (u.isReminderDue) meta.push('reminder due');
  if (u.bill.hasPaymentMismatch) meta.push('payment mismatch');
  if (meta.length > 0) bits.push(`  _(${meta.join(' · ')})_`);
  bits.push(`  \`${u.bill.id}\``);
  return bits.join('');
}

/** Upcoming bills, soonest-due first. */
export function formatUpcomingBills(bills: UpcomingBillResponse[], heading?: string): string {
  const sorted = [...bills].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const body = sorted.length === 0 ? '_No bills due._' : sorted.map(upcomingBillLine).join('\n');
  return heading ? `${heading}\n\n${body}` : body;
}

function potLine(p: SpendingPotWithProgress): string {
  const bits: string[] = [`- ${p.name} (${p.type})  ${money(p.spent, 'GBP')} / ${money(p.budgetAmount, 'GBP')}`];
  const meta: string[] = [];
  if (p.isExceeded) meta.push('exceeded');
  else if (p.isWarning) meta.push('warning');
  if (meta.length > 0) bits.push(`  _(${meta.join(' · ')})_`);
  return bits.join('');
}

/** Spending pot balances for the requested month. */
export function formatPotBalances(pots: SpendingPotWithProgress[], heading?: string): string {
  const body = pots.length === 0 ? '_No spending pots._' : pots.map(potLine).join('\n');
  return heading ? `${heading}\n\n${body}` : body;
}

function goalLine(g: SavingsGoalWithProjection): string {
  const bits: string[] = [
    `- ${g.goal.name}  ${money(g.goal.currentAmount, 'GBP')} / ${money(g.goal.targetAmount, 'GBP')} (${g.percentageComplete.toFixed(0)}%)`,
  ];
  const meta: string[] = [g.goal.status];
  if (g.projectedCompletionDate) meta.push(`projected ${g.projectedCompletionDate.slice(0, 10)}`);
  if (!g.isOnTrack && g.goal.status === 'Active') meta.push('behind target');
  bits.push(`  _(${meta.join(' · ')})_`);
  return bits.join('');
}

/** Savings goals with their projection. */
export function formatSavingsGoals(goals: SavingsGoalWithProjection[], heading?: string): string {
  const body = goals.length === 0 ? '_No savings goals._' : goals.map(goalLine).join('\n');
  return heading ? `${heading}\n\n${body}` : body;
}

/** Full detail for the disposable-income breakdown. */
export function formatAffordability(a: AffordabilityResponse): string {
  const lines: string[] = ['# Disposable Income', ''];
  lines.push(`- **Monthly income:** ${money(a.monthlyIncome, 'GBP')} (${a.incomeConfidence}, ${a.incomeSource})`);
  lines.push(`- **Committed costs:** ${money(a.committedCosts, 'GBP')}`);
  lines.push(`- **Existing debt payments:** ${money(a.existingDebtPayments, 'GBP')}`);
  lines.push(`- **Discretionary spend:** ${money(a.discretionarySpend, 'GBP')}`);
  lines.push(`- **Planned savings:** ${money(a.plannedSavings, 'GBP')}`);
  lines.push(`- **Emergency buffer:** ${money(a.emergencyBuffer, 'GBP')}`);
  lines.push(`- **Safe surplus:** ${money(a.safeSurplus, 'GBP')}`);
  lines.push(`- **Suggested extra debt payment:** ${money(a.suggestedDebtPayment, 'GBP')}`);
  lines.push(`- **Calculated:** ${a.calculatedAt}`);
  return lines.join('\n');
}
