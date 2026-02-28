import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Circle, Loader2, AlertTriangle, CheckCircle2, X, Check } from 'lucide-react';
import type { TaskStatus } from '@/services/taskService';

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle; colour: string }[] = [
  { value: 'NotStarted', label: 'Not Started', icon: Circle, colour: 'text-muted-foreground' },
  { value: 'InProgress', label: 'In Progress', icon: Loader2, colour: 'text-brand' },
  { value: 'Blocked', label: 'Blocked', icon: AlertTriangle, colour: 'text-destructive' },
  { value: 'Completed', label: 'Completed', icon: CheckCircle2, colour: 'text-success' },
];

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus, blockedReason?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusSelector({ value, onChange, disabled, className }: StatusSelectorProps) {
  const [showBlockedInput, setShowBlockedInput] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showBlockedInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showBlockedInput]);

  const handleClick = (status: TaskStatus) => {
    if (status === 'Blocked') {
      setShowBlockedInput(true);
      setBlockedReason('');
    } else {
      setShowBlockedInput(false);
      onChange(status);
    }
  };

  const handleBlockedConfirm = () => {
    const reason = blockedReason.trim();
    if (!reason) return;
    setShowBlockedInput(false);
    setBlockedReason('');
    onChange('Blocked', reason);
  };

  const handleBlockedCancel = () => {
    setShowBlockedInput(false);
    setBlockedReason('');
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-1">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(option.value)}
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

      {showBlockedInput && (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={blockedReason}
            onChange={(e) => setBlockedReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlockedConfirm();
              if (e.key === 'Escape') handleBlockedCancel();
            }}
            placeholder="Why is this task blocked?"
            className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleBlockedConfirm}
            disabled={!blockedReason.trim()}
            title="Confirm blocked reason"
            className="rounded-md border border-success/30 bg-success/10 p-1.5 text-success transition-colors hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleBlockedCancel}
            title="Cancel"
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
