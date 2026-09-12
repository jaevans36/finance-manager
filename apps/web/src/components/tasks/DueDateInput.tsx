import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DueDateInputProps {
  /** ISO date string, or null when no due date is set */
  value: string | null;
  onChange: (dueDate: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export const DueDateInput = ({ value, onChange, disabled = false, className }: DueDateInputProps) => {
  const dateOnly = value ? new Date(value).toISOString().split('T')[0] : '';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <input
        type="date"
        value={dateOnly}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        disabled={disabled}
        aria-label="Due date"
        className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      {value && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="flex items-center rounded-md border border-border px-1.5 py-1 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          title="Clear due date"
          aria-label="Clear due date"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
