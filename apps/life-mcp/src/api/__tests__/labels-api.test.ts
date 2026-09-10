import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createLabel, listLabels } from '../labels-api.js';

let http: AxiosInstance;
let mock: MockAdapter;

beforeEach(() => {
  http = axios.create({ baseURL: 'http://api.test' });
  mock = new MockAdapter(http);
});
afterEach(() => mock.restore());

describe('listLabels', () => {
  it('GETs /api/v1/labels', async () => {
    mock.onGet('/api/v1/labels').reply(200, [{ id: 'l1', name: 'Home', colourHex: '#21B8A4' }]);
    await expect(listLabels(http)).resolves.toEqual([{ id: 'l1', name: 'Home', colourHex: '#21B8A4' }]);
  });

  it('returns an empty array unchanged', async () => {
    mock.onGet('/api/v1/labels').reply(200, []);
    await expect(listLabels(http)).resolves.toEqual([]);
  });
});

describe('createLabel', () => {
  it('POSTs { name, colourHex }', async () => {
    mock.onPost('/api/v1/labels').reply(201, { id: 'l2', name: 'Work', colourHex: '#3B82F6' });
    const label = await createLabel(http, { name: 'Work', colourHex: '#3B82F6' });
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ name: 'Work', colourHex: '#3B82F6' });
    expect(label.id).toBe('l2');
  });

  it('propagates a 409 for a duplicate name', async () => {
    mock.onPost('/api/v1/labels').reply(409, 'A label with that name already exists.');
    await expect(createLabel(http, { name: 'Work', colourHex: '#3B82F6' })).rejects.toMatchObject({
      response: { status: 409 },
    });
  });

  it('sends whatever colourHex it is given (server normalises case)', async () => {
    mock.onPost('/api/v1/labels').reply(201, { id: 'l3', name: 'x', colourHex: '#ABCDEF' });
    await createLabel(http, { name: 'x', colourHex: '#abcdef' });
    expect(JSON.parse(mock.history.post[0].data).colourHex).toBe('#abcdef');
  });
});
