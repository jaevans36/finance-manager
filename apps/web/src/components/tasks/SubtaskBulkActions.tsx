import { memo } from 'react';
import { CheckSquare, Trash2, SquareCheck, Square } from 'lucide-react';
import { Button } from '../ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onCompleteSelected: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskBulkActions = memo(({
  selectedCount,
  totalCount,
  onCompleteSelected,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  isLoading = false,
}: SubtaskBulkActionsProps) => {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div
      className="mb-2 flex flex-wrap items-center gap-3 rounded border border-primary bg-primary/10 px-3 py-2"
      role="toolbar"
      aria-label="Bulk actions for selected subtasks"
    >
      <span className="text-xs font-semibold text-primary">
        {selectedCount} selected
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onCompleteSelected}
          disabled={isLoading}
          aria-label="Complete selected subtasks"
        >
          <CheckSquare className="mr-1 h-3.5 w-3.5" />
          Complete selected
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          disabled={isLoading}
          aria-label="Delete selected subtasks"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Delete selected
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          disabled={isLoading}
          aria-label={allSelected ? 'Deselect all subtasks' : 'Select all subtasks'}
        >
          {allSelected
            ? <Square className="mr-1 h-3.5 w-3.5" />
            : <SquareCheck className="mr-1 h-3.5 w-3.5" />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
    </div>
  );
});

SubtaskBulkActions.displayName = 'SubtaskBulkActions';
