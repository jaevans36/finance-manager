import { cn } from '@/lib/utils';
import { Circle, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TaskStatus } from '@/services/taskService';

const statusConfig: Record<TaskStatus, {
  label: string;
  icon: typeof Circle;
  className: string;
}> = {
  NotStarted: {
    label: 'Not Started',
    icon: Circle,
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  InProgress: {
    label: 'In Progress',
    icon: Loader2,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  Blocked: {
    label: 'Blocked',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  Completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.NotStarted;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className,
        className,
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'InProgress' && 'animate-spin')} />
      {config.label}
    </span>
  );
}
