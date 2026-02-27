import { cn } from '@/lib/utils';
import type { UrgencyLevel, ImportanceLevel } from '@/services/taskService';

const levels: Array<{ value: 'Low' | 'Medium' | 'High'; label: string }> = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Med' },
  { value: 'High', label: 'High' },
];

const urgencyColours: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  Medium: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  High: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const importanceColours: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  Medium: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
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
