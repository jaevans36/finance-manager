import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
import type { Task } from '../../../services/taskService';
import { chartColors } from '../../../components/charts/chartTheme';

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Critical': return chartColors.critical;
    case 'High': return chartColors.high;
    case 'Medium': return chartColors.medium;
    default: return chartColors.low;
  }
};

const removeDayPrefix = (title: string): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of days) {
    if (title.endsWith(` - ${day}`)) {
      return title.substring(0, title.length - day.length - 3);
    }
  }
  return title;
};

interface DailyTaskCardProps {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasks: Task[];
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export const DailyTaskCard = ({
  date,
  totalTasks,
  completedTasks,
  completionRate,
  tasks,
  onToggleTask,
}: DailyTaskCardProps) => {
  const dayDate = new Date(date);
  const dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayNumber = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  const getPercentageOffset = (pct: number) => {
    if (pct <= 2) return 'left-6';
    if (pct >= 98) return '-left-4';
    return 'left-0';
  };

  return (
    <div className="rounded-lg border border-border bg-card p-[18px] min-h-[320px] flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 hover:-translate-y-[3px]">
      <div className="flex justify-between items-start pb-2.5 mb-3">
        <div className="flex flex-col">
          <div className="font-semibold text-base text-foreground">{dayName}</div>
          <span className="block mt-0.5 text-xs text-muted-foreground">{dayNumber}</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {completedTasks}/{totalTasks} tasks
        </span>
      </div>

      {totalTasks > 0 && (
        <div className="relative w-full mb-4">
          <div className="relative w-full h-6 mb-1">
            <div
              className="absolute flex flex-col items-center gap-0.5 transition-[left] duration-500 -translate-x-1/2"
              style={{ left: `${completionRate}%` }}
            >
              <span
                className={cn(
                  'text-sm font-bold text-primary relative',
                  getPercentageOffset(completionRate),
                )}
              >
                {completionRate.toFixed(0)}%
              </span>
              <div
                className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-primary"
              />
            </div>
          </div>
          <div className="w-full h-3 bg-secondary rounded-sm relative">
            <div
              className={cn(
                'h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-500',
                completionRate === 100 ? 'rounded-sm' : 'rounded-l-sm',
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2.5 flex-1 overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-2 p-2 border border-border rounded-sm text-sm transition-all duration-200 cursor-pointer hover:border-primary hover:translate-x-0.5',
                task.completed ? 'bg-secondary' : 'bg-card',
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 cursor-pointer"
                checked={task.completed}
                onChange={() => onToggleTask(task.id, task.completed)}
              />
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'font-medium line-clamp-2 leading-[1.4]',
                    task.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground',
                  )}
                  title={task.title}
                >
                  {removeDayPrefix(task.title)}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge
                    className="text-[11px] text-white"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </Badge>
                  {task.groupName && (
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-sm bg-secondary">
                      {task.groupName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span className="block text-center text-xs text-muted-foreground p-5">No tasks</span>
      )}
    </div>
  );
};
