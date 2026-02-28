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
    activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'Moderate focus',
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Deep work',
    activeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
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
