import { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { TaskDto } from '../../types/task.js';

jest.mock('../../api/tasks-api.js');
jest.mock('../../api/events-api.js');
import * as tasksApi from '../../api/tasks-api.js';
import * as eventsApi from '../../api/events-api.js';

import { tasksTodayResource } from '../tasks-today.js';
import { tasksOverdueResource } from '../tasks-overdue.js';
import { eventsUpcomingResource } from '../events-upcoming.js';

const mockTasks = tasksApi as jest.Mocked<typeof tasksApi>;
const mockEvents = eventsApi as jest.Mocked<typeof eventsApi>;
const http = {} as AxiosInstance;

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
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isOwner: true,
    assignedTo: null,
    assignedBy: null,
    reminderAt: null,
    labels: [],
    ...overrides,
  };
}

describe('life-manager://tasks/today', () => {
  it('renders a dated heading and a checklist', async () => {
    mockTasks.listTasks.mockResolvedValue([task({ title: 'Due one' })]);
    const out = await tasksTodayResource.loader(http);
    expect(out).toMatch(/# Tasks due today \(\d{4}-\d{2}-\d{2}\)/);
    expect(out).toContain('Due one');
  });

  it('says nothing due today when empty', async () => {
    mockTasks.listTasks.mockResolvedValue([]);
    expect(await tasksTodayResource.loader(http)).toContain('Nothing due today.');
  });

  it('returns a friendly error line if the API fails', async () => {
    mockTasks.listTasks.mockRejectedValue(new AxiosError('boom', 'ECONNREFUSED'));
    const out = await tasksTodayResource.loader(http);
    expect(out).toContain('Could not load life-manager://tasks/today');
  });
});

describe('life-manager://tasks/overdue', () => {
  it('keeps only tasks dated before today and counts the days', async () => {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    const laterToday = new Date(now);
    laterToday.setHours(23, 0, 0, 0);

    mockTasks.listTasks.mockResolvedValue([
      task({ id: 'old', title: 'Old one', dueDate: threeDaysAgo.toISOString() }),
      task({ id: 'today', title: 'Today one', dueDate: laterToday.toISOString() }),
      task({ id: 'nodate', title: 'No date' }),
    ]);

    const out = await tasksOverdueResource.loader(http);
    expect(out).toContain('Old one');
    expect(out).toMatch(/3 days overdue/);
    expect(out).not.toContain('Today one');
    expect(out).not.toContain('No date');
  });

  it('says nothing overdue when the filtered set is empty', async () => {
    mockTasks.listTasks.mockResolvedValue([task()]); // no dueDate → filtered out
    expect(await tasksOverdueResource.loader(http)).toContain('Nothing overdue.');
  });

  it('returns a friendly error line if the API fails', async () => {
    mockTasks.listTasks.mockRejectedValue(new AxiosError('boom', 'ECONNREFUSED'));
    expect(await tasksOverdueResource.loader(http)).toContain('Could not load life-manager://tasks/overdue');
  });
});

describe('life-manager://events/upcoming', () => {
  it('renders events grouped by day', async () => {
    mockEvents.listEvents.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        title: 'Standup',
        description: null,
        startDate: '2026-09-11T09:00:00Z',
        endDate: '2026-09-11T09:15:00Z',
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
      },
    ]);
    const out = await eventsUpcomingResource.loader(http);
    expect(out).toContain('# Next 7 days');
    expect(out).toContain('Standup');
  });

  it('says nothing scheduled when empty', async () => {
    mockEvents.listEvents.mockResolvedValue([]);
    expect(await eventsUpcomingResource.loader(http)).toContain('Nothing scheduled.');
  });
});
