import type { AxiosInstance } from 'axios';
import type {
  CreateTaskInput,
  EnergyLevel,
  Priority,
  TaskDto,
  TaskStatus,
  UpdateTaskInput,
} from '../types/task.js';

const BASE = '/api/v1/tasks';

export interface ListTasksParams {
  status?: TaskStatus;
  priority?: Priority;
  groupId?: string;
  labelId?: string;
  completed?: boolean;
  rootOnly?: boolean;
  startDate?: string;
  endDate?: string;
  energyLevel?: EnergyLevel;
}

function pruneUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export async function listTasks(http: AxiosInstance, params: ListTasksParams = {}): Promise<TaskDto[]> {
  const res = await http.get<TaskDto[]>(BASE, { params: pruneUndefined(params) });
  return res.data;
}

export async function getTask(
  http: AxiosInstance,
  input: { id: string; includeSubtasks?: boolean },
): Promise<TaskDto> {
  const res = await http.get<TaskDto>(`${BASE}/${input.id}`, {
    params: { includeSubtasks: input.includeSubtasks ?? true },
  });
  return res.data;
}

export async function createTask(http: AxiosInstance, input: CreateTaskInput): Promise<TaskDto> {
  if (input.reminderAt && !input.dueDate) {
    throw new Error('ReminderAt requires a DueDate to be set.');
  }
  const res = await http.post<TaskDto>(BASE, pruneUndefined({ ...input }));
  return res.data;
}

export async function updateTask(
  http: AxiosInstance,
  input: { id: string } & UpdateTaskInput,
): Promise<TaskDto> {
  const { id, ...rest } = input;
  if (rest.reminderAt && rest.dueDate === undefined) {
    // life-api still enforces reminder⇒dueDate on update unless a dueDate already exists;
    // let the API decide rather than guessing at stored state — only guard the obvious case.
  }
  const res = await http.put<TaskDto>(`${BASE}/${id}`, pruneUndefined({ ...rest }));
  return res.data;
}

export async function completeTask(http: AxiosInstance, input: { id: string }): Promise<TaskDto> {
  const res = await http.patch<TaskDto>(`${BASE}/${input.id}/status`, { status: 'Completed' });
  return res.data;
}

export async function deleteTask(http: AxiosInstance, input: { id: string }): Promise<void> {
  await http.delete(`${BASE}/${input.id}`);
}

export async function addSubtask(
  http: AxiosInstance,
  input: { parentTaskId: string; title: string },
): Promise<TaskDto> {
  const res = await http.post<TaskDto>(`${BASE}/${input.parentTaskId}/subtasks`, {
    title: input.title,
  });
  return res.data;
}
