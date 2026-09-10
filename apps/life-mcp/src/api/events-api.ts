import type { AxiosInstance } from 'axios';
import type { CreateEventInput, EventDto, UpdateEventInput } from '../types/event.js';

const BASE = '/api/v1/events';

export interface ListEventsParams {
  startDate: string;
  endDate: string;
  groupId?: string;
}

function pruneUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function assertRange(startDate: string, endDate: string): void {
  if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
    throw new Error('endDate must be on or after startDate.');
  }
}

export async function listEvents(http: AxiosInstance, params: ListEventsParams): Promise<EventDto[]> {
  assertRange(params.startDate, params.endDate);
  const res = await http.get<EventDto[]>(BASE, { params: pruneUndefined(params) });
  return res.data;
}

export async function getEvent(http: AxiosInstance, input: { id: string }): Promise<EventDto> {
  const res = await http.get<EventDto>(`${BASE}/${input.id}`);
  return res.data;
}

export async function createEvent(http: AxiosInstance, input: CreateEventInput): Promise<EventDto> {
  assertRange(input.startDate, input.endDate);
  const res = await http.post<EventDto>(BASE, pruneUndefined({ ...input }));
  return res.data;
}

export async function updateEvent(
  http: AxiosInstance,
  input: { id: string } & UpdateEventInput,
): Promise<EventDto> {
  const { id, ...rest } = input;
  if (rest.startDate && rest.endDate) {
    assertRange(rest.startDate, rest.endDate);
  }
  const res = await http.put<EventDto>(`${BASE}/${id}`, pruneUndefined({ ...rest }));
  return res.data;
}

export async function deleteEvent(http: AxiosInstance, input: { id: string }): Promise<void> {
  await http.delete(`${BASE}/${input.id}`);
}
