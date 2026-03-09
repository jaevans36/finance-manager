import { cn } from '@/lib/utils';
import type { Quadrant } from '@/services/taskService';

const quadrantConfig: Record<Quadrant, { label: string; shortLabel: string; className: string }> = {
  Q1: {
    label: 'Do First',
    shortLabel: 'Q1',
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive',
  },
  Q2: {
    label: 'Schedule',
    shortLabel: 'Q2',
    className: 'bg-brand-muted text-brand-muted-foreground',
  },
  Q3: {
    label: 'Delegate',
    shortLabel: 'Q3',
    className: 'bg-warning/10 text-warning-foreground dark:bg-warning/10 dark:text-warning',
  },
  Q4: {
    label: 'Eliminate',
    shortLabel: 'Q4',
    className: 'bg-muted text-muted-foreground',
  },
};

interface QuadrantBadgeProps {
  quadrant: Quadrant;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const QuadrantBadge = ({ quadrant, size = 'sm', showLabel = false, className }: QuadrantBadgeProps) => {
  const config = quadrantConfig[quadrant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        config.className,
        className,
      )}
    >
      {config.shortLabel}
      {showLabel && <span className="hidden sm:inline">· {config.label}</span>}
    </span>
  );
};
