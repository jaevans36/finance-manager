import { cn } from '@/lib/utils';
import { Circle, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TaskStatus } from '@/services/taskService';

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle; colour: string }[] = [
  { value: 'NotStarted', label: 'Not Started', icon: Circle, colour: 'text-slate-500' },
  { value: 'InProgress', label: 'In Progress', icon: Loader2, colour: 'text-blue-500' },
  { value: 'Blocked', label: 'Blocked', icon: AlertTriangle, colour: 'text-red-500' },
  { value: 'Completed', label: 'Completed', icon: CheckCircle2, colour: 'text-green-500' },
];

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusSelector({ value, onChange, disabled, className }: StatusSelectorProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {statusOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.label}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              'border hover:bg-accent/50',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', option.colour, isActive && 'opacity-100')} />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
