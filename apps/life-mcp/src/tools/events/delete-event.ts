import { z } from 'zod';
import { deleteEvent } from '../../api/events-api.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  eventId: z.string().uuid().describe('The event id.'),
};

export const deleteEventTool = defineTool({
  name: 'delete_event',
  backend: 'life',
  config: {
    title: 'Delete an event',
    description: 'Permanently delete a calendar event. This cannot be undone.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteEvent(http, { id: args.eventId });
    return textResult(`Deleted event \`${args.eventId}\`.`);
  },
});
