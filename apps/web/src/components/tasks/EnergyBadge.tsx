import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { EnergyLevel } from '@/services/taskService';

const energyConfig: Record<EnergyLevel, { label: string; className: string; dotClassName: string }> = {
  High: {
    label: 'High Energy',
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive',
    dotClassName: 'bg-destructive',
  },
  Medium: {
    label: 'Medium Energy',
    className: 'bg-warning/10 text-warning-foreground dark:bg-warning/10 dark:text-warning',
    dotClassName: 'bg-warning',
  },
  Low: {
    label: 'Low Energy',
    className: 'bg-success/10 text-success-foreground dark:bg-success/10 dark:text-success',
    dotClassName: 'bg-success',
  },
};

interface EnergyBadgeProps {
  energy: EnergyLevel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const EnergyBadge = ({
  energy,
  size = 'sm',
  showLabel = false,
  showIcon = false,
  className,
}: EnergyBadgeProps) => {
  const config = energyConfig[energy];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        config.className,
        className,
      )}
      title={config.label}
    >
      {showIcon ? (
        <Zap className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      ) : (
        <span className={cn('inline-block rounded-full', size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2', config.dotClassName)} />
      )}
      {showLabel && energy}
    </span>
  );
};
