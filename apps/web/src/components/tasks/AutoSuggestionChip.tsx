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
        'flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2',
        'dark:border-amber-800 dark:bg-amber-950/30',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
          Suggested: {suggestion.suggestedQuadrant}
          {suggestion.suggestedUrgency && ` (${suggestion.suggestedUrgency} urgency`}
          {suggestion.suggestedImportance && `, ${suggestion.suggestedImportance} importance)`}
        </p>
        <p className="truncate text-[10px] text-amber-600 dark:text-amber-400">
          {suggestion.reason}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onAccept}
          disabled={isLoading}
          className={cn(
            'rounded-md p-1 text-green-600 transition-colors hover:bg-green-100',
            'dark:text-green-400 dark:hover:bg-green-900/40',
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
            'rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100',
            'dark:hover:bg-slate-800',
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
