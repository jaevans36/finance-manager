import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Task } from '../../services/taskService';
import { Badge } from '../ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskItemProps {
  subtask: Task;
  depth?: number;
  isSelected?: boolean;
  onToggleComplete: (id: string, completed: boolean) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  /** Ref forwarded by dnd-kit for sortable handle */
  dragHandleProps?: Record<string, unknown>;
  /** Style overrides from dnd-kit transform */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'destructive' as const;
    case 'Medium':
      return 'warning' as const;
    case 'Low':
      return 'success' as const;
    default:
      return 'secondary' as const;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskItem = memo(({
  subtask,
  isSelected = false,
  onToggleComplete,
  onRename,
  onDelete,
  onSelect,
  dragHandleProps,
  style,
}: SubtaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isOverdue =
    subtask.dueDate && !subtask.completed && new Date(subtask.dueDate) < new Date();

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== subtask.title) {
      onRename(subtask.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, subtask.id, subtask.title, onRename]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(subtask.title);
    setIsEditing(false);
  }, [subtask.title]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  return (
    <div
      className={cn(
        'group/row mb-0.5 flex items-center gap-2 rounded px-3 py-2 transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-secondary',
        subtask.completed && 'opacity-60',
      )}
      style={style}
      role="listitem"
      aria-label={`Subtask: ${subtask.title}`}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(subtask.id)}
          className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-primary"
          aria-label={`Select subtask "${subtask.title}"`}
        />
      )}

      {/* Drag handle – visible on hover */}
      <span
        data-drag
        className="flex flex-shrink-0 cursor-grab items-center text-muted-foreground opacity-0 transition-opacity active:cursor-grabbing group-hover/row:opacity-100 md:opacity-100"
        {...dragHandleProps}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      {/* Title – click to toggle completion, or inline edit */}
      {isEditing ? (
        <input
          ref={editInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleSaveEdit}
          className="min-w-0 flex-1 rounded border border-primary bg-card px-2 py-0.5 text-[13px] text-foreground outline-none"
          aria-label="Edit subtask title"
        />
      ) : (
        <span
          className={cn(
            'min-w-0 flex-1 cursor-pointer select-none truncate text-[13px] hover:text-primary',
            subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
          onClick={() => onToggleComplete(subtask.id, !subtask.completed)}
          role="button"
          tabIndex={0}
          aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
        >
          {subtask.title}
        </span>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-1.5">
        {/* Only show non-default priority */}
        {subtask.priority !== 'Medium' && (
          <Badge
            variant={getPriorityVariant(subtask.priority)}
            className="px-1.5 py-0.5 text-[10px]"
          >
            {subtask.priority}
          </Badge>
        )}

        {subtask.dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
          </span>
        )}

        {isOverdue && (
          <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px]">
            Overdue
          </Badge>
        )}
      </div>

      {/* Actions – visible on hover */}
      <div
        data-actions
        className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 md:opacity-100"
      >
        {isEditing ? (
          <>
            <button
              className="flex items-center justify-center rounded border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={handleSaveEdit}
              aria-label="Save edit"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex items-center justify-center rounded border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              className="flex items-center justify-center rounded border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => {
                setEditValue(subtask.title);
                setIsEditing(true);
              }}
              aria-label={`Edit subtask "${subtask.title}"`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex items-center justify-center rounded border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => onDelete(subtask.id)}
              aria-label={`Delete subtask "${subtask.title}"`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

SubtaskItem.displayName = 'SubtaskItem';
