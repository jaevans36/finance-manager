import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { EnergyLevel } from '@/services/taskService';

const energyConfig: Record<EnergyLevel, { label: string; className: string; dotClassName: string }> = {
  High: {
    label: 'High Energy',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dotClassName: 'bg-red-500',
  },
  Medium: {
    label: 'Medium Energy',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dotClassName: 'bg-amber-500',
  },
  Low: {
    label: 'Low Energy',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dotClassName: 'bg-emerald-500',
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
