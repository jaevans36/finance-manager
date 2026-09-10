import { z } from 'zod';
import { getEvent } from '../../api/events-api.js';
import { formatEventDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  eventId: z.string().uuid().describe('The event id.'),
};

export const getEventTool = defineTool({
  name: 'get_event',
  backend: 'life',
  config: {
    title: 'Get an event',
    description: 'Fetch one calendar event by id.',
    inputSchema,
  },
  async handler(args, { http }) {
    const event = await getEvent(http, { id: args.eventId });
    return textResult(formatEventDetail(event), { event });
  },
});
