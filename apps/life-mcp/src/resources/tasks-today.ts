import { listTasks } from '../api/tasks-api.js';
import { endOfDay, isoDate, startOfDay } from '../utils/format-date.js';
import { formatTaskList } from '../utils/format.js';
import { defineResource } from './_register.js';

export const tasksTodayResource = defineResource({
  uri: 'life-manager://tasks/today',
  name: 'Tasks due today',
  description: 'Open tasks whose due date falls today.',
  mimeType: 'text/markdown',
  backend: 'life',
  async loader(http) {
    const now = new Date();
    const tasks = await listTasks(http, {
      completed: false,
      startDate: startOfDay(now).toISOString(),
      endDate: endOfDay(now).toISOString(),
    });
    if (tasks.length === 0) return `# Tasks due today (${isoDate(now)})\n\nNothing due today.`;
    return formatTaskList(tasks, `# Tasks due today (${isoDate(now)})`);
  },
});
