import { z } from 'zod';
import { updateEvent } from '../../api/events-api.js';
import { todayHint } from '../../utils/format-date.js';
import { formatEventDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  eventId: z.string().uuid().describe('The event id (required).'),
  title: z.string().min(1).max(200).optional(),
  startDate: z.string().optional().describe('ISO 8601.'),
  endDate: z.string().optional().describe('ISO 8601.'),
  isAllDay: z.boolean().optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  reminderMinutes: z.number().int().min(0).optional(),
  groupId: z.string().uuid().optional(),
};

export const updateEventTool = defineTool({
  name: 'update_event',
  backend: 'life',
  config: {
    title: 'Update an event',
    description: `Update fields on an event. Omitted fields are left unchanged. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const { eventId, ...rest } = args;
    const event = await updateEvent(http, { id: eventId, ...rest });
    return textResult(`Updated:\n\n${formatEventDetail(event)}`, { event });
  },
});
