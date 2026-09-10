import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from '../events-api.js';

let http: AxiosInstance;
let mock: MockAdapter;

const eventFixture = {
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
};

beforeEach(() => {
  http = axios.create({ baseURL: 'http://api.test' });
  mock = new MockAdapter(http);
});
afterEach(() => mock.restore());

describe('listEvents', () => {
  it('GETs /api/v1/events with the date window', async () => {
    mock.onGet('/api/v1/events').reply(200, [eventFixture]);
    await expect(
      listEvents(http, { startDate: '2026-09-11', endDate: '2026-09-18' }),
    ).resolves.toEqual([eventFixture]);
    expect(mock.history.get[0].params).toEqual({ startDate: '2026-09-11', endDate: '2026-09-18' });
  });

  it('forwards groupId when given', async () => {
    mock.onGet('/api/v1/events').reply(200, []);
    await listEvents(http, { startDate: '2026-09-11', endDate: '2026-09-18', groupId: 'g1' });
    expect(mock.history.get[0].params).toEqual({
      startDate: '2026-09-11',
      endDate: '2026-09-18',
      groupId: 'g1',
    });
  });

  it('rejects an inverted window before making a request', async () => {
    await expect(
      listEvents(http, { startDate: '2026-09-18', endDate: '2026-09-11' }),
    ).rejects.toThrow('endDate must be on or after startDate.');
    expect(mock.history.get).toHaveLength(0);
  });
});

describe('getEvent', () => {
  it('GETs /api/v1/events/{id}', async () => {
    mock.onGet('/api/v1/events/e1').reply(200, eventFixture);
    await expect(getEvent(http, { id: 'e1' })).resolves.toEqual(eventFixture);
  });

  it('propagates a 404', async () => {
    mock.onGet('/api/v1/events/nope').reply(404, { error: { message: 'Event not found' } });
    await expect(getEvent(http, { id: 'nope' })).rejects.toMatchObject({ response: { status: 404 } });
  });
});

describe('createEvent', () => {
  it('POSTs the body and prunes undefined fields', async () => {
    mock.onPost('/api/v1/events').reply(201, eventFixture);
    await createEvent(http, {
      title: 'Standup',
      startDate: '2026-09-11T09:00:00Z',
      endDate: '2026-09-11T09:15:00Z',
      location: undefined,
    });
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      title: 'Standup',
      startDate: '2026-09-11T09:00:00Z',
      endDate: '2026-09-11T09:15:00Z',
    });
  });

  it('rejects end before start pre-request', async () => {
    await expect(
      createEvent(http, {
        title: 'Bad',
        startDate: '2026-09-11T10:00:00Z',
        endDate: '2026-09-11T09:00:00Z',
      }),
    ).rejects.toThrow('endDate must be on or after startDate.');
    expect(mock.history.post).toHaveLength(0);
  });

  it('accepts an equal start and end', async () => {
    mock.onPost('/api/v1/events').reply(201, eventFixture);
    await createEvent(http, {
      title: 'Point',
      startDate: '2026-09-11T09:00:00Z',
      endDate: '2026-09-11T09:00:00Z',
    });
    expect(mock.history.post).toHaveLength(1);
  });
});

describe('updateEvent', () => {
  it('PUTs only provided fields, no id in body', async () => {
    mock.onPut('/api/v1/events/e1').reply(200, eventFixture);
    await updateEvent(http, { id: 'e1', title: 'Renamed', location: 'Room 2' });
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ title: 'Renamed', location: 'Room 2' });
  });

  it('validates the window only when both dates are supplied', async () => {
    mock.onPut('/api/v1/events/e1').reply(200, eventFixture);
    await updateEvent(http, { id: 'e1', endDate: '2026-09-11T08:00:00Z' }); // start omitted → no check
    expect(mock.history.put).toHaveLength(1);

    await expect(
      updateEvent(http, {
        id: 'e1',
        startDate: '2026-09-11T10:00:00Z',
        endDate: '2026-09-11T09:00:00Z',
      }),
    ).rejects.toThrow('endDate must be on or after startDate.');
  });
});

describe('deleteEvent', () => {
  it('DELETEs and resolves undefined', async () => {
    mock.onDelete('/api/v1/events/e1').reply(204);
    await expect(deleteEvent(http, { id: 'e1' })).resolves.toBeUndefined();
  });
});
