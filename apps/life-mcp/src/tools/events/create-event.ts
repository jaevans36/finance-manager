import { z } from 'zod';
import { createEvent } from '../../api/events-api.js';
import { todayHint } from '../../utils/format-date.js';
import { formatEventDetail } from '../../utils/format.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  title: z.string().min(1).max(200).describe('Event title (required).'),
  startDate: z.string().describe('ISO 8601 start (required).'),
  endDate: z.string().describe('ISO 8601 end (required, on or after startDate).'),
  isAllDay: z.boolean().optional().describe('Treat start/end as whole-day boundaries.'),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  reminderMinutes: z.number().int().min(0).optional().describe('Minutes before start to remind.'),
  groupId: z.string().uuid().optional(),
};

export const createEventTool = defineTool({
  name: 'create_event',
  backend: 'life',
  config: {
    title: 'Create an event',
    description: `Create a calendar event. NOT idempotent — calling twice makes two events. ${todayHint()}`,
    inputSchema,
  },
  async handler(args, { http }) {
    const event = await createEvent(http, {
      title: args.title,
      startDate: args.startDate,
      endDate: args.endDate,
      isAllDay: args.isAllDay,
      description: args.description,
      location: args.location,
      reminderMinutes: args.reminderMinutes,
      groupId: args.groupId,
    });
    return textResult(`Created:\n\n${formatEventDetail(event)}`, { event });
  },
});
