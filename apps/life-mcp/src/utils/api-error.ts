import axios from 'axios';

/**
 * Reduce any error thrown while calling life-api into a single human-readable line
 * an LLM can relay to the user. Handles the four shapes life-api / axios produce:
 *
 *   1. { error: { message: "..." } }                 — most Tasks/Events failures
 *   2. bare JSON string body                          — some BadRequest / Conflict responses
 *   3. ASP.NET ValidationProblemDetails               — { errors: { Field: ["..."] }, ... }
 *   4. axios error with no response                   — API unreachable / timeout
 */
export function describeApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return `Could not reach the Life Manager API (${err.code ?? 'no response'}): ${err.message}`;
    }

    const status = err.response.status;
    const data = err.response.data as unknown;

    // Shape 2: bare string body
    if (typeof data === 'string' && data.trim() !== '') {
      return `Life Manager API error (${status}): ${data.trim()}`;
    }

    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;

      // Shape 1: { error: { message } }
      const nested = obj.error;
      if (nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).message === 'string') {
        return `Life Manager API error (${status}): ${(nested as Record<string, unknown>).message as string}`;
      }
      if (typeof obj.message === 'string') {
        return `Life Manager API error (${status}): ${obj.message}`;
      }

      // Shape 3: ValidationProblemDetails
      const errors = obj.errors;
      if (errors && typeof errors === 'object') {
        const parts = Object.entries(errors as Record<string, unknown>).map(([field, msgs]) => {
          const list = Array.isArray(msgs) ? msgs.join('; ') : String(msgs);
          return `${field}: ${list}`;
        });
        if (parts.length > 0) {
          return `Life Manager API validation error (${status}): ${parts.join(' | ')}`;
        }
      }
      if (typeof obj.title === 'string') {
        return `Life Manager API error (${status}): ${obj.title}`;
      }
    }

    return `Life Manager API error (${status}).`;
  }

  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export interface ToolErrorResult {
  content: { type: 'text'; text: string }[];
  isError: true;
}

/** Wrap any thrown error as an MCP tool error result (plain object; no SDK import). */
export function toToolError(err: unknown): ToolErrorResult {
  return {
    content: [{ type: 'text', text: describeApiError(err) }],
    isError: true,
  };
}
