import { cn } from '../../lib/utils';
import { CheckCircleIcon, CircleIcon, AlertCircleIcon, FolderIcon } from 'lucide-react';

const colorMap = {
  info: { icon: 'bg-muted text-muted-foreground', border: 'border-l-muted-foreground' },
  success: { icon: 'bg-success/15 text-success', border: 'border-l-success' },
  warning: { icon: 'bg-warning/15 text-warning', border: 'border-l-warning' },
  primary: { icon: 'bg-primary/15 text-primary', border: 'border-l-primary' },
} as const;

interface StatCardProps {
  color: keyof typeof colorMap;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  ariaLabel: string;
}

const StatCard = ({ color, icon, value, label, ariaLabel }: StatCardProps) => (
  <div
    className={cn(
      'flex items-center gap-4 rounded-lg border border-border bg-card p-5 border-l-4 transition-transform hover:-translate-y-0.5 md:gap-3 md:p-3.5',
      colorMap[color].border,
    )}
    aria-label={ariaLabel}
  >
    <div
      className={cn('flex size-12 shrink-0 items-center justify-center rounded-lg md:size-10', colorMap[color].icon)}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className="flex-1">
      <div className="text-[28px] font-bold leading-tight text-foreground">{value}</div>
      <div className="mt-1 text-[13px] text-muted-foreground opacity-80">{label}</div>
    </div>
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
      className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-3 md:mb-5"
      role="region"
      aria-label="Task statistics"
    >
      <StatCard
        color="info"
        icon={<CircleIcon size={24} />}
        value={totalTasks}
        label="Total Tasks"
        ariaLabel={`Total tasks: ${totalTasks}`}
      />
      <StatCard
        color="success"
        icon={<CheckCircleIcon size={24} />}
        value={
          <>
            {completedTasks}
            <span className={cn('ml-2 text-sm font-semibold', completionRate >= 50 ? 'text-success' : 'text-muted-foreground')}>
              {completionRate}%
            </span>
          </>
        }
        label="Completed"
        ariaLabel={`Completed tasks: ${completedTasks} of ${totalTasks}, ${completionRate}%`}
      />
      <StatCard
        color="warning"
        icon={<AlertCircleIcon size={24} />}
        value={overdueTasks}
        label="Overdue Tasks"
        ariaLabel={`Overdue tasks: ${overdueTasks}`}
      />
      <StatCard
        color="primary"
        icon={<FolderIcon size={24} />}
        value={totalGroups}
        label="Task Groups"
        ariaLabel={`Task groups: ${totalGroups}`}
      />
    </div>
  );
};
