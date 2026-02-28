import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { EnergyLevel } from '@/services/taskService';

const energyOptions: Array<{
  value: EnergyLevel;
  label: string;
  description: string;
  activeClass: string;
}> = [
  {
    value: 'Low',
    label: 'Low',
    description: 'Routine tasks',
    activeClass: 'bg-success/10 text-success-foreground border-success/30',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'Moderate focus',
    activeClass: 'bg-warning/10 text-warning-foreground border-warning/30 dark:bg-warning/10 dark:text-warning',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Deep work',
    activeClass: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/10 dark:text-destructive',
  },
];

interface EnergySelectorProps {
  value: EnergyLevel | null;
  onChange: (energy: EnergyLevel | null) => void;
  disabled?: boolean;
  className?: string;
}

export const EnergySelector = ({ value, onChange, disabled = false, className }: EnergySelectorProps) => {
  const handleClick = (energy: EnergyLevel) => {
    // Toggle: clicking active level clears it
    onChange(value === energy ? null : energy);
  };

  return (
    <div className={cn('flex gap-1.5', className)}>
      {energyOptions.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(option.value)}
            className={cn(
              'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isActive
                ? option.activeClass
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            title={option.description}
          >
            <Zap className="h-3 w-3" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
