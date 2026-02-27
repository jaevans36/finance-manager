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
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
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
