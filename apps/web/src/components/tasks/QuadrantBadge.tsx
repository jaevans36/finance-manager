import { cn } from '@/lib/utils';
import type { Quadrant } from '@/services/taskService';

const quadrantConfig: Record<Quadrant, { label: string; shortLabel: string; className: string }> = {
  Q1: {
    label: 'Do First',
    shortLabel: 'Q1',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  Q2: {
    label: 'Schedule',
    shortLabel: 'Q2',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  Q3: {
    label: 'Delegate',
    shortLabel: 'Q3',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  Q4: {
    label: 'Eliminate',
    shortLabel: 'Q4',
    className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
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
