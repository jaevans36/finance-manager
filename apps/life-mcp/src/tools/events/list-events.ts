import { z } from 'zod';
import { listEvents } from '../../api/events-api.js';
import { todayHint } from '../../utils/format-date.js';
import { formatEventList } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  startDate: z.string().describe('ISO 8601 — start of the window (events ending on/after this).'),
  endDate: z.string().describe('ISO 8601 — end of the window (events starting on/before this).'),
};

export const listEventsTool = defineTool({
  name: 'list_events',
  backend: 'life',
  config: {
    title: 'List events',
    description: `List calendar events in a date window, grouped by day. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const events = await listEvents(http, { startDate: args.startDate, endDate: args.endDate });
    return textResult(formatEventList(events, `# Events (${events.length})`), { events });
  },
});
