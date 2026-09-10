import { AxiosError } from 'axios';
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

jest.mock('../../../api/events-api.js');
import * as eventsApi from '../../../api/events-api.js';

import { listEventsTool } from '../list-events.js';
import { getEventTool } from '../get-event.js';
import { createEventTool } from '../create-event.js';
import { updateEventTool } from '../update-event.js';
import { deleteEventTool } from '../delete-event.js';
import type { AnyToolDef } from '../../_register.js';

const mockApi = eventsApi as jest.Mocked<typeof eventsApi>;
const http = {} as AxiosInstance;
const ctx = { http };
const UUID = '22222222-2222-2222-2222-222222222222';

const event = {
  id: UUID,
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
};

function parse(def: AnyToolDef, input: unknown) {
  return z.object(def.config.inputSchema).safeParse(input);
}

describe('list_events', () => {
  it('requires startDate and endDate', () => {
    expect(parse(listEventsTool, { startDate: '2026-09-11', endDate: '2026-09-18' }).success).toBe(true);
    expect(parse(listEventsTool, { startDate: '2026-09-11' }).success).toBe(false);
  });

  it('passes the window through and renders grouped output', async () => {
    mockApi.listEvents.mockResolvedValue([event]);
    const res = await listEventsTool.handler({ startDate: '2026-09-11', endDate: '2026-09-18' }, ctx);
    expect(mockApi.listEvents).toHaveBeenCalledWith(http, {
      startDate: '2026-09-11',
      endDate: '2026-09-18',
    });
    expect(res.content[0].text).toContain('### 2026-09-11');
    expect(res.structuredContent).toEqual({ events: [event] });
  });

  it('maps an API error to isError', async () => {
    mockApi.listEvents.mockRejectedValue(new AxiosError('down', 'ECONNREFUSED'));
    const res = await listEventsTool.handler({ startDate: 'a', endDate: 'b' }, ctx);
    expect(res.isError).toBe(true);
  });
});

describe('get_event', () => {
  it('requires a uuid eventId', () => {
    expect(parse(getEventTool, { eventId: UUID }).success).toBe(true);
    expect(parse(getEventTool, { eventId: 'nope' }).success).toBe(false);
  });

  it('renders detail', async () => {
    mockApi.getEvent.mockResolvedValue(event);
    const res = await getEventTool.handler({ eventId: UUID }, ctx);
    expect(mockApi.getEvent).toHaveBeenCalledWith(http, { id: UUID });
    expect(res.content[0].text).toContain('# Standup');
  });
});

describe('create_event', () => {
  it('requires title, startDate, endDate', () => {
    expect(
      parse(createEventTool, { title: 'x', startDate: 'a', endDate: 'b' }).success,
    ).toBe(true);
    expect(parse(createEventTool, { title: 'x', startDate: 'a' }).success).toBe(false);
  });

  it('forwards the mapped body', async () => {
    mockApi.createEvent.mockResolvedValue(event);
    await createEventTool.handler(
      { title: 'Standup', startDate: 's', endDate: 'e', isAllDay: true },
      ctx,
    );
    expect(mockApi.createEvent).toHaveBeenCalledWith(
      http,
      expect.objectContaining({ title: 'Standup', startDate: 's', endDate: 'e', isAllDay: true }),
    );
  });

  it('surfaces the range rule as isError', async () => {
    mockApi.createEvent.mockRejectedValue(new Error('endDate must be on or after startDate.'));
    const res = await createEventTool.handler({ title: 'x', startDate: 'b', endDate: 'a' }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('on or after startDate');
  });
});

describe('update_event', () => {
  it('requires eventId', () => {
    expect(parse(updateEventTool, { eventId: UUID, title: 'x' }).success).toBe(true);
    expect(parse(updateEventTool, { title: 'x' }).success).toBe(false);
  });

  it('splits eventId from the body', async () => {
    mockApi.updateEvent.mockResolvedValue(event);
    await updateEventTool.handler({ eventId: UUID, location: 'Room 2' }, ctx);
    expect(mockApi.updateEvent).toHaveBeenCalledWith(http, { id: UUID, location: 'Room 2' });
  });
});

describe('delete_event', () => {
  it('deletes and confirms', async () => {
    mockApi.deleteEvent.mockResolvedValue(undefined);
    const res = await deleteEventTool.handler({ eventId: UUID }, ctx);
    expect(mockApi.deleteEvent).toHaveBeenCalledWith(http, { id: UUID });
    expect(res.content[0].text).toContain('Deleted event');
  });

  it('maps a 404 to isError', async () => {
    mockApi.deleteEvent.mockRejectedValue(
      new AxiosError('nf', '404', undefined, undefined, {
        status: 404,
        data: { error: { message: 'Event not found' } },
      } as never),
    );
    const res = await deleteEventTool.handler({ eventId: UUID }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Event not found');
  });
});
