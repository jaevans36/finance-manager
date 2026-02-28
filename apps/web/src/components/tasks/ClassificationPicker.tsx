import { cn } from '@/lib/utils';
import type { UrgencyLevel, ImportanceLevel } from '@/services/taskService';

const levels: Array<{ value: 'Low' | 'Medium' | 'High'; label: string }> = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Med' },
  { value: 'High', label: 'High' },
];

const urgencyColours: Record<string, string> = {
  Low: 'bg-success/10 text-success-foreground border-success/30 dark:bg-success/10 dark:text-success',
  Medium: 'bg-warning/10 text-warning-foreground border-warning/30 dark:bg-warning/10 dark:text-warning',
  High: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/10 dark:text-destructive',
};

const importanceColours: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground border-border',
  Medium: 'bg-brand-muted text-brand-muted-foreground border-brand/30',
  High: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
};

interface ClassificationPickerProps {
  urgency: UrgencyLevel | null;
  importance: ImportanceLevel | null;
  onChange: (urgency: UrgencyLevel | null, importance: ImportanceLevel | null) => void;
  disabled?: boolean;
  className?: string;
}

export const ClassificationPicker = ({
  urgency,
  importance,
  onChange,
  disabled = false,
  className,
}: ClassificationPickerProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Urgency row */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Urgency
        </label>
        <div className="flex gap-1.5">
          {levels.map((level) => {
            const isActive = urgency === level.value;
            return (
              <button
                key={`urgency-${level.value}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange(isActive ? null : level.value, importance)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isActive
                    ? urgencyColours[level.value]
                    : 'border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Importance row */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Importance
        </label>
        <div className="flex gap-1.5">
          {levels.map((level) => {
            const isActive = importance === level.value;
            return (
              <button
                key={`importance-${level.value}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange(urgency, isActive ? null : level.value)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isActive
                    ? importanceColours[level.value]
                    : 'border-border bg-background text-muted-foreground hover:bg-accent',
                )}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
