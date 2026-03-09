import { cn } from '@/lib/utils';
import { Sparkles, Check, X } from 'lucide-react';
import type { ClassificationSuggestion } from '@/services/taskService';

interface AutoSuggestionChipProps {
  suggestion: ClassificationSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  className?: string;
}

export const AutoSuggestionChip = ({
  suggestion,
  onAccept,
  onDismiss,
  isLoading = false,
  className,
}: AutoSuggestionChipProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2',
        'dark:border-warning/20 dark:bg-warning/5',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-warning-foreground">
          Suggested: {suggestion.suggestedQuadrant}
          {suggestion.suggestedUrgency && ` (${suggestion.suggestedUrgency} urgency`}
          {suggestion.suggestedImportance && `, ${suggestion.suggestedImportance} importance)`}
        </p>
        <p className="truncate text-[10px] text-warning">
          {suggestion.reason}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onAccept}
          disabled={isLoading}
          className={cn(
            'rounded-md p-1 text-success transition-colors hover:bg-success/10',
            'dark:text-success dark:hover:bg-success/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label="Accept suggestion"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isLoading}
          className={cn(
            'rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted',
            'dark:hover:bg-muted',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label="Dismiss suggestion"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
