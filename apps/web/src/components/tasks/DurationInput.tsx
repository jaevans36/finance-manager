import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, X } from 'lucide-react';

const presets = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

interface DurationInputProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
  className?: string;
}

export const DurationInput = ({ value, onChange, disabled = false, className }: DurationInputProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handlePresetClick = (minutes: number) => {
    // Toggle: clicking active preset clears it
    onChange(value === minutes ? null : minutes);
    setShowCustom(false);
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 480) {
      onChange(parsed);
      setShowCustom(false);
      setCustomValue('');
    }
  };

  const handleClear = () => {
    onChange(null);
    setShowCustom(false);
    setCustomValue('');
  };

  const isCustom = value !== null && !presets.some((p) => p.minutes === value);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const isActive = value === preset.minutes;
          return (
            <button
              key={preset.minutes}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetClick(preset.minutes)}
              className={cn(
                'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isActive
                  ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <Clock className="h-3 w-3" />
              {preset.label}
            </button>
          );
        })}

        {/* Custom button */}
        {!showCustom ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowCustom(true)}
            className={cn(
              'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isCustom
                ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {isCustom ? `${value}m` : 'Custom'}
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={480}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="mins"
              disabled={disabled}
              className="h-7 w-16 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={disabled}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Set
            </button>
          </div>
        )}

        {/* Clear button */}
        {value !== null && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            className="flex items-center rounded-md border border-border px-1.5 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            title="Clear estimate"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Display current value */}
      {value !== null && (
        <p className="text-xs text-muted-foreground">
          Estimated: {formatDuration(value)}
        </p>
      )}
    </div>
  );
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}
