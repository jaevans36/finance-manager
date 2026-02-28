import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { useWipSummary } from '@/hooks/queries/useSettings';

interface WipCounterProps {
  className?: string;
}

export function WipCounter({ className }: WipCounterProps) {
  const { data: wipSummary } = useWipSummary();

  if (!wipSummary?.globalWipLimit) return null;

  const { inProgressCount, globalWipLimit, isOverLimit } = wipSummary;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        isOverLimit
          ? 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive'
          : 'bg-brand-muted text-brand-muted-foreground',
        className,
      )}
    >
      {isOverLimit && <AlertCircle className="h-3.5 w-3.5" />}
      <span>
        WIP: {inProgressCount}/{globalWipLimit}
      </span>
    </div>
  );
}
