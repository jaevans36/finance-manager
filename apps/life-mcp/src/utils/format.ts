import type { EventDto } from '../types/event.js';
import type { LabelDto } from '../types/label.js';
import type { Priority, TaskDto } from '../types/task.js';

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
