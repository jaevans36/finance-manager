import { listEvents } from '../api/events-api.js';
import { plusDays } from '../utils/format-date.js';
import { formatEventList } from '../utils/format.js';
import { defineResource } from './_register.js';

export const eventsUpcomingResource = defineResource({
  uri: 'life-manager://events/upcoming',
  name: 'Upcoming events',
  description: 'Calendar events in the next 7 days.',
  mimeType: 'text/markdown',
  backend: 'life',
  async loader(http) {
    const now = new Date();
    const events = await listEvents(http, {
      startDate: now.toISOString(),
      endDate: plusDays(now, 7).toISOString(),
    });
    if (events.length === 0) return '# Next 7 days\n\nNothing scheduled.';
    return formatEventList(events, '# Next 7 days');
  },
});
