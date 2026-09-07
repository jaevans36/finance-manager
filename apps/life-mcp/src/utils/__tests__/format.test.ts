import type { TaskDto } from '../../types/task.js';
import { formatTaskDetail, formatTaskList } from '../format.js';
import { daysBetween, isoDate, startOfDay } from '../format-date.js';

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
