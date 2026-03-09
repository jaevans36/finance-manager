import { memo } from 'react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskProgressProps {
  /** Number of completed subtasks */
  completed: number;
  /** Total number of subtasks */
  total: number;
  /** Percentage (0–100). Computed from completed/total if omitted. */
  percentage?: number;
  /** Compact variant for inline use inside TaskItem */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getBarColour = (pct: number) => {
  if (pct >= 66) return 'bg-success';
  if (pct >= 33) return 'bg-warning';
  return 'bg-destructive';
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskProgress = memo(({
  completed,
  total,
  percentage,
  compact = false,
}: SubtaskProgressProps) => {
  if (total === 0) return null;

  const pct = percentage ?? Math.round((completed / total) * 100);
  const remaining = total - completed;

  return (
    <div className="group/tooltip relative w-full">
      <div
        className={cn(
          'flex w-full',
          compact ? 'flex-row items-center gap-2' : 'flex-col items-stretch gap-1',
        )}
      >
        <div
          className={cn(
            'relative flex-1 overflow-hidden rounded-full bg-muted',
            compact ? 'h-1' : 'h-2',
          )}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-300 ease-out', getBarColour(pct))}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className={cn(
            'whitespace-nowrap font-medium text-muted-foreground',
            compact ? 'text-[11px]' : 'text-xs',
          )}
        >
          {completed}/{total} completed ({pct}%)
        </span>
      </div>
      <div className="pointer-events-none invisible absolute bottom-[calc(100%+4px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] text-background opacity-0 transition-all duration-200 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
        {completed} of {total} subtasks complete &bull; {remaining} remaining
      </div>
    </div>
  );
});

SubtaskProgress.displayName = 'SubtaskProgress';
