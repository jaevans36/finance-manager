import { AxiosError } from 'axios';
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

jest.mock('../../../api/tasks-api.js');
import * as tasksApi from '../../../api/tasks-api.js';

import { listTasksTool } from '../list-tasks.js';
import { getTaskTool } from '../get-task.js';
import { createTaskTool } from '../create-task.js';
import { updateTaskTool } from '../update-task.js';
import { completeTaskTool } from '../complete-task.js';
import { deleteTaskTool } from '../delete-task.js';
import { addSubtaskTool } from '../add-subtask.js';
import type { AnyToolDef } from '../../_register.js';

const mockApi = tasksApi as jest.Mocked<typeof tasksApi>;
const http = {} as AxiosInstance;
const ctx = { http };

const task = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Task',
  description: null,
  priority: 'High' as const,
  dueDate: '2026-09-10T00:00:00Z',
  completed: false,
  completedAt: null,
  status: 'NotStarted' as const,
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
};

/** Validate an input object against a tool's declared inputSchema. */
function parse(def: AnyToolDef, input: unknown) {
  return z.object(def.config.inputSchema).safeParse(input);
}

const UUID = '11111111-1111-1111-1111-111111111111';

describe('list_tasks', () => {
  it('accepts filters and rejects a bad priority', () => {
    expect(parse(listTasksTool, { status: 'InProgress', limit: 5 }).success).toBe(true);
    expect(parse(listTasksTool, { priority: 'Urgent' }).success).toBe(false);
  });

  it('defaults limit to 20', () => {
    const parsed = parse(listTasksTool, {});
    expect(parsed.success && parsed.data.limit).toBe(20);
  });

  it('maps dueAfter/dueBefore to startDate/endDate and slices to limit', async () => {
    mockApi.listTasks.mockResolvedValue([task, { ...task, id: 'b' }, { ...task, id: 'c' }]);
    const res = await listTasksTool.handler(
      { dueAfter: '2026-09-01', dueBefore: '2026-09-30', limit: 2 },
      ctx,
    );
    expect(mockApi.listTasks).toHaveBeenCalledWith(http, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: undefined,
      priority: undefined,
      labelId: undefined,
      groupId: undefined,
      completed: undefined,
    });
    expect(res.content[0].text).toContain('Tasks (2 of 3)');
  });

  it('maps an API error to an isError result', async () => {
    mockApi.listTasks.mockRejectedValue(new AxiosError('nope', 'ECONNREFUSED'));
    const res = await listTasksTool.handler({ limit: 20 }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Could not reach the Life Manager API');
  });
});

describe('get_task', () => {
  it('requires a uuid taskId', () => {
    expect(parse(getTaskTool, { taskId: UUID }).success).toBe(true);
    expect(parse(getTaskTool, { taskId: 'x' }).success).toBe(false);
  });

  it('defaults includeSubtasks true and renders detail', async () => {
    mockApi.getTask.mockResolvedValue(task);
    const res = await getTaskTool.handler({ taskId: UUID, includeSubtasks: true }, ctx);
    expect(mockApi.getTask).toHaveBeenCalledWith(http, { id: UUID, includeSubtasks: true });
    expect(res.content[0].text).toContain('# Task');
    expect(res.structuredContent).toEqual({ task });
  });
});

describe('create_task', () => {
  it('requires a title within 1-200 chars', () => {
    expect(parse(createTaskTool, { title: 'x' }).success).toBe(true);
    expect(parse(createTaskTool, {}).success).toBe(false);
    expect(parse(createTaskTool, { title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('forwards the mapped body', async () => {
    mockApi.createTask.mockResolvedValue(task);
    await createTaskTool.handler(
      { title: 'New', priority: 'Low', dueDate: '2026-09-10' },
      ctx,
    );
    expect(mockApi.createTask).toHaveBeenCalledWith(
      http,
      expect.objectContaining({ title: 'New', priority: 'Low', dueDate: '2026-09-10' }),
    );
  });

  it('surfaces the reminder/dueDate rule as an isError result', async () => {
    mockApi.createTask.mockRejectedValue(new Error('ReminderAt requires a DueDate to be set.'));
    const res = await createTaskTool.handler({ title: 'New', reminderAt: '2026-09-10T09:00' }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('ReminderAt requires a DueDate');
  });
});

describe('update_task', () => {
  it('requires taskId and rejects an unknown priority', () => {
    expect(parse(updateTaskTool, { taskId: UUID, title: 'x' }).success).toBe(true);
    expect(parse(updateTaskTool, { taskId: UUID, priority: 'Nope' }).success).toBe(false);
    expect(parse(updateTaskTool, { title: 'x' }).success).toBe(false);
  });

  it('splits taskId from the update body', async () => {
    mockApi.updateTask.mockResolvedValue(task);
    await updateTaskTool.handler({ taskId: UUID, title: 'Renamed', completed: true }, ctx);
    expect(mockApi.updateTask).toHaveBeenCalledWith(http, {
      id: UUID,
      title: 'Renamed',
      completed: true,
    });
  });
});

describe('complete_task', () => {
  it('completes and reports the title', async () => {
    mockApi.completeTask.mockResolvedValue({ ...task, status: 'Completed', completed: true });
    const res = await completeTaskTool.handler({ taskId: UUID }, ctx);
    expect(mockApi.completeTask).toHaveBeenCalledWith(http, { id: UUID });
    expect(res.content[0].text).toContain('Completed "Task"');
  });
});

describe('delete_task', () => {
  it('deletes and confirms', async () => {
    mockApi.deleteTask.mockResolvedValue(undefined);
    const res = await deleteTaskTool.handler({ taskId: UUID }, ctx);
    expect(mockApi.deleteTask).toHaveBeenCalledWith(http, { id: UUID });
    expect(res.content[0].text).toContain('Deleted task');
  });

  it('maps a 404 to an isError result', async () => {
    const err = new AxiosError('not found', '404', undefined, undefined, {
      status: 404,
      data: { error: { message: 'Task not found' } },
    } as never);
    mockApi.deleteTask.mockRejectedValue(err);
    const res = await deleteTaskTool.handler({ taskId: UUID }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Task not found');
  });
});

describe('add_subtask', () => {
  it('requires parentTaskId uuid and a title', () => {
    expect(parse(addSubtaskTool, { parentTaskId: UUID, title: 'S' }).success).toBe(true);
    expect(parse(addSubtaskTool, { parentTaskId: 'x', title: 'S' }).success).toBe(false);
    expect(parse(addSubtaskTool, { parentTaskId: UUID }).success).toBe(false);
  });

  it('creates the subtask under the parent', async () => {
    mockApi.addSubtask.mockResolvedValue({ ...task, id: 'sub-1' });
    const res = await addSubtaskTool.handler({ parentTaskId: UUID, title: 'Sub' }, ctx);
    expect(mockApi.addSubtask).toHaveBeenCalledWith(http, { parentTaskId: UUID, title: 'Sub' });
    expect(res.content[0].text).toContain('sub-1');
  });
});
