import type { EventDto } from '../../types/event.js';
import type { TaskDto } from '../../types/task.js';
import {
  formatEventDetail,
  formatEventList,
  formatLabelList,
  formatTaskDetail,
  formatTaskList,
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
