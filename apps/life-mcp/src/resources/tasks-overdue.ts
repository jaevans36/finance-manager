import { listTasks } from '../api/tasks-api.js';
import { daysBetween, startOfDay } from '../utils/format-date.js';
import { defineResource } from './_register.js';

export const tasksOverdueResource = defineResource({
  uri: 'life-manager://tasks/overdue',
  name: 'Overdue tasks',
  description: 'Open tasks whose due date is before today, most overdue first.',
  mimeType: 'text/markdown',
  backend: 'life',
  async loader(http) {
    const now = new Date();
    const startToday = startOfDay(now);
    const tasks = await listTasks(http, {
      completed: false,
      endDate: startToday.toISOString(),
    });
    const overdue = tasks
      .filter((t) => t.dueDate && new Date(t.dueDate).getTime() < startToday.getTime())
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

    if (overdue.length === 0) return '# Overdue tasks\n\nNothing overdue.';

    const lines = overdue.map((t) => {
      const days = daysBetween(new Date(t.dueDate as string), now);
      const box = '[ ]';
      const pr = t.priority ? ` ${t.priority}` : '';
      return `- ${box} ${t.title}  _(${days} day${days === 1 ? '' : 's'} overdue${pr})_  \`${t.id}\``;
    });
    return `# Overdue tasks (${overdue.length})\n\n${lines.join('\n')}`;
  },
});
