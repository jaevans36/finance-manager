import { cn } from '../../lib/utils';
import { CheckCircleIcon, CircleIcon, AlertCircleIcon, FolderIcon } from 'lucide-react';

const colorMap = {
  info: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  primary: 'text-primary',
} as const;

interface StatChipProps {
  color: keyof typeof colorMap;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  ariaLabel: string;
}

// A slim inline chip rather than a tall bordered card — these are secondary
// context, not the main content, so they shouldn't cost a full row of chrome.
const StatChip = ({ color, icon, value, label, ariaLabel }: StatChipProps) => (
  <div
    className="flex items-center gap-1.5 whitespace-nowrap text-sm"
    aria-label={ariaLabel}
  >
    <span className={cn('flex shrink-0 items-center', colorMap[color])} aria-hidden="true">
      {icon}
    </span>
    <span className="font-semibold text-foreground">{value}</span>
    <span className="text-muted-foreground">{label}</span>
  </div>
);

interface Task {
  id: string;
  completed: boolean;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  groupId: string | null;
}

interface TaskStatisticsProps {
  tasks: Task[];
  totalGroups: number;
}

export const TaskStatistics = ({ tasks, totalGroups }: TaskStatisticsProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  
  const overdueTasks = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-1.5"
      role="region"
      aria-label="Task statistics"
    >
      <StatChip
        color="info"
        icon={<CircleIcon size={15} />}
        value={totalTasks}
        label="total"
        ariaLabel={`Total tasks: ${totalTasks}`}
      />
      <StatChip
        color="success"
        icon={<CheckCircleIcon size={15} />}
        value={
          <>
            {completedTasks}
            <span className={cn('ml-1', completionRate >= 50 ? 'text-success' : 'text-muted-foreground')}>
              ({completionRate}%)
            </span>
          </>
        }
        label="completed"
        ariaLabel={`Completed tasks: ${completedTasks} of ${totalTasks}, ${completionRate}%`}
      />
      <StatChip
        color="warning"
        icon={<AlertCircleIcon size={15} />}
        value={overdueTasks}
        label="overdue"
        ariaLabel={`Overdue tasks: ${overdueTasks}`}
      />
      <StatChip
        color="primary"
        icon={<FolderIcon size={15} />}
        value={totalGroups}
        label="groups"
        ariaLabel={`Task groups: ${totalGroups}`}
      />
    </div>
  );
};
