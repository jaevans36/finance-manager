import { AxiosError, AxiosHeaders } from 'axios';
import { describeApiError, toToolError } from '../api-error.js';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  const config = { headers } as never;
  const response = { status, data, statusText: '', headers, config } as never;
  return new AxiosError('Request failed', String(status), config, {}, response);
}

describe('describeApiError', () => {
  it('maps { error: { message } }', () => {
    expect(describeApiError(axiosErrorWith(404, { error: { message: 'Task not found' } }))).toBe(
      'Life Manager API error (404): Task not found',
    );
  });

  it('maps a bare string body', () => {
    expect(
      describeApiError(axiosErrorWith(400, 'ReminderAt requires a DueDate to be set.')),
    ).toBe('Life Manager API error (400): ReminderAt requires a DueDate to be set.');
  });

  it('maps ASP.NET ValidationProblemDetails', () => {
    const msg = describeApiError(
      axiosErrorWith(400, { errors: { Title: ['The Title field is required.'] }, status: 400 }),
    );
    expect(msg).toContain('validation error (400)');
    expect(msg).toContain('Title: The Title field is required.');
  });

  it('falls back to a generic message when the body has no known shape', () => {
    expect(describeApiError(axiosErrorWith(500, { weird: true }))).toBe('Life Manager API error (500).');
  });

  it('describes a connection failure when there is no response', () => {
    const err = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');
    expect(describeApiError(err)).toContain('Could not reach the Life Manager API');
    expect(describeApiError(err)).toContain('ECONNREFUSED');
  });

  it('passes through a plain Error message', () => {
    expect(describeApiError(new Error('boom'))).toBe('boom');
  });
});

describe('toToolError', () => {
  it('wraps the description as an MCP error result', () => {
    const result = toToolError(axiosErrorWith(409, 'A label with that name already exists.'));
    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Life Manager API error (409): A label with that name already exists.',
    });
  });
});
