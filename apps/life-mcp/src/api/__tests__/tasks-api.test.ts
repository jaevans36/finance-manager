import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  addSubtask,
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../tasks-api.js';

let http: AxiosInstance;
let mock: MockAdapter;

const taskFixture = { id: 't1', title: 'Test', status: 'NotStarted', labels: [] };

beforeEach(() => {
  http = axios.create({ baseURL: 'http://api.test' });
  mock = new MockAdapter(http);
});

afterEach(() => mock.restore());

describe('listTasks', () => {
  it('GETs /api/v1/tasks with no params', async () => {
    mock.onGet('/api/v1/tasks').reply(200, [taskFixture]);
    await expect(listTasks(http)).resolves.toEqual([taskFixture]);
    expect(mock.history.get[0].params).toEqual({});
  });

  it('forwards provided filters and prunes undefined ones', async () => {
    mock.onGet('/api/v1/tasks').reply(200, []);
    await listTasks(http, { status: 'InProgress', priority: 'High', completed: false });
    expect(mock.history.get[0].params).toEqual({ status: 'InProgress', priority: 'High', completed: false });
  });

  it('maps date-range filters through unchanged', async () => {
    mock.onGet('/api/v1/tasks').reply(200, []);
    await listTasks(http, { startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(mock.history.get[0].params).toEqual({ startDate: '2026-09-01', endDate: '2026-09-30' });
  });
});

describe('getTask', () => {
  it('defaults includeSubtasks to true', async () => {
    mock.onGet('/api/v1/tasks/t1').reply(200, taskFixture);
    await getTask(http, { id: 't1' });
    expect(mock.history.get[0].params).toEqual({ includeSubtasks: true });
  });

  it('passes includeSubtasks=false when asked', async () => {
    mock.onGet('/api/v1/tasks/t1').reply(200, taskFixture);
    await getTask(http, { id: 't1', includeSubtasks: false });
    expect(mock.history.get[0].params).toEqual({ includeSubtasks: false });
  });
});

describe('createTask', () => {
  it('POSTs the body and returns the created task', async () => {
    mock.onPost('/api/v1/tasks').reply(201, taskFixture);
    await expect(createTask(http, { title: 'New' })).resolves.toEqual(taskFixture);
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ title: 'New' });
  });

  it('prunes undefined fields from the body', async () => {
    mock.onPost('/api/v1/tasks').reply(201, taskFixture);
    await createTask(http, { title: 'New', priority: 'Low', description: undefined });
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ title: 'New', priority: 'Low' });
  });

  it('rejects reminderAt without dueDate before making a request', async () => {
    await expect(
      createTask(http, { title: 'New', reminderAt: '2026-09-10T09:00:00' }),
    ).rejects.toThrow('ReminderAt requires a DueDate to be set.');
    expect(mock.history.post).toHaveLength(0);
  });

  it('allows reminderAt when dueDate is also set', async () => {
    mock.onPost('/api/v1/tasks').reply(201, taskFixture);
    await createTask(http, {
      title: 'New',
      dueDate: '2026-09-10',
      reminderAt: '2026-09-10T09:00:00',
    });
    expect(mock.history.post).toHaveLength(1);
  });
});

describe('updateTask', () => {
  it('PUTs only the provided fields to /api/v1/tasks/{id}', async () => {
    mock.onPut('/api/v1/tasks/t1').reply(200, taskFixture);
    await updateTask(http, { id: 't1', title: 'Renamed', completed: true });
    expect(mock.history.put[0].url).toBe('/api/v1/tasks/t1');
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ title: 'Renamed', completed: true });
  });

  it('does not send the id in the body', async () => {
    mock.onPut('/api/v1/tasks/t1').reply(200, taskFixture);
    await updateTask(http, { id: 't1', priority: 'Critical' });
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ priority: 'Critical' });
  });

  it('forwards clearReminderAt', async () => {
    mock.onPut('/api/v1/tasks/t1').reply(200, taskFixture);
    await updateTask(http, { id: 't1', clearReminderAt: true });
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ clearReminderAt: true });
  });
});

describe('completeTask', () => {
  it('PATCHes /status with Completed', async () => {
    mock.onPatch('/api/v1/tasks/t1/status').reply(200, { ...taskFixture, status: 'Completed' });
    const res = await completeTask(http, { id: 't1' });
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ status: 'Completed' });
    expect(res.status).toBe('Completed');
  });
});

describe('deleteTask', () => {
  it('DELETEs /api/v1/tasks/{id} and resolves undefined', async () => {
    mock.onDelete('/api/v1/tasks/t1').reply(204);
    await expect(deleteTask(http, { id: 't1' })).resolves.toBeUndefined();
  });

  it('propagates a 404', async () => {
    mock.onDelete('/api/v1/tasks/nope').reply(404, { error: { message: 'Task not found' } });
    await expect(deleteTask(http, { id: 'nope' })).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

describe('addSubtask', () => {
  it('POSTs { title } to /api/v1/tasks/{parentTaskId}/subtasks', async () => {
    mock.onPost('/api/v1/tasks/p1/subtasks').reply(201, { ...taskFixture, id: 's1', parentTaskId: 'p1' });
    const res = await addSubtask(http, { parentTaskId: 'p1', title: 'Sub' });
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ title: 'Sub' });
    expect(res.id).toBe('s1');
  });
});
