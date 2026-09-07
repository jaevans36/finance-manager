/**
 * Structured logging to STDERR ONLY.
 *
 * stdout is the MCP stdio framing channel — writing anything else to it corrupts the
 * protocol stream. Never use console.log / process.stdout.write anywhere in this package.
 */

type Level = 'info' | 'warn' | 'error';

function emit(level: Level, message: string, extra?: unknown): void {
  const line: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    message,
  };
  if (extra instanceof Error) {
    line.error = { name: extra.name, message: extra.message };
  } else if (extra !== undefined) {
    line.detail = extra;
  }
  process.stderr.write(`${JSON.stringify(line)}\n`);
}

export const log = {
  info: (message: string, extra?: unknown) => emit('info', message, extra),
  warn: (message: string, extra?: unknown) => emit('warn', message, extra),
  error: (message: string, extra?: unknown) => emit('error', message, extra),
};
