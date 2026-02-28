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
    className: 'bg-muted text-muted-foreground',
  },
  InProgress: {
    label: 'In Progress',
    icon: Loader2,
    className: 'bg-brand-muted text-brand-muted-foreground',
  },
  Blocked: {
    label: 'Blocked',
    icon: AlertTriangle,
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive',
  },
  Completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success-foreground',
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
