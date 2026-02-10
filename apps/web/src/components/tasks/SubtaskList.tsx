import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { spacing, borderRadius } from '@finance-manager/ui/styles';
import type { Task } from '../../services/taskService';
import type { CreateSubtaskInput } from '../../services/subtaskService';
import { TextSecondary, Alert } from '../ui';
import { Skeleton, SkeletonLine } from '../ui/Skeleton';
import { SubtaskItem } from './SubtaskItem';
import { SubtaskBulkActions } from './SubtaskBulkActions';
import { SubtaskProgress } from './SubtaskProgress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskListProps {
  parentTask: Task;
  subtasks: Task[];
  isLoading: boolean;
  error: string | null;
  onCreateSubtask: (input: CreateSubtaskInput) => Promise<Task | null>;
  onBulkCreate: (titles: string[]) => Promise<Task[] | null>;
  onToggleComplete: (id: string, completed: boolean) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onBulkComplete: () => Promise<void>;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// ---------------------------------------------------------------------------
// Styled – Todoist-inspired inline pattern
// ---------------------------------------------------------------------------

const Container = styled.div`
  margin-top: ${spacing.sm};
`;

const ProgressRow = styled.div`
  padding: ${spacing.xs} 0;
  margin-bottom: ${spacing.xs};
`;

const InlineAddRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  cursor: pointer;
  border-radius: ${borderRadius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background-color 150ms ease, color 150ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const InlineInput = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.xs} ${spacing.md};
`;

const AddInput = styled.input`
  flex: 1;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.md};
  padding: ${spacing.sm} ${spacing.md};
  font-size: 13px;
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  transition: border-color 150ms ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const AddHint = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

const EmptyHint = styled.div`
  padding: ${spacing.sm} ${spacing.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const BulkActionsContainer = styled.div`
  padding: ${spacing.xs} ${spacing.md};
`;

// ---------------------------------------------------------------------------
// Sortable wrapper (internal)
// ---------------------------------------------------------------------------

const SortableSubtaskItem = ({
  subtask,
  isSelected,
  onToggleComplete,
  onRename,
  onDelete,
  onSelect,
}: {
  subtask: Task;
  isSelected: boolean;
  onToggleComplete: (id: string, completed: boolean) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SubtaskItem
        subtask={subtask}
        isSelected={isSelected}
        onToggleComplete={onToggleComplete}
        onRename={onRename}
        onDelete={onDelete}
        onSelect={onSelect}
        dragHandleProps={listeners}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const SubtaskList = ({
  parentTask: _parentTask,
  subtasks,
  isLoading,
  error,
  onCreateSubtask,
  onBulkCreate: _onBulkCreate,
  onToggleComplete,
  onRename,
  onDelete,
  onReorder,
  onBulkComplete: _onBulkComplete,
  selectedIds,
  onToggleSelected,
  onSelectAll,
  onDeselectAll,
}: SubtaskListProps) => {
  // Inline add state
  const [isAdding, setIsAdding] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Focus input when switching to add mode
  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  // Computed
  // Subtasks are returned in order from the API
  const sortedSubtasks = useMemo(() => [...subtasks], [subtasks]);
  const completedCount = useMemo(
    () => subtasks.filter((s) => s.completed).length,
    [subtasks],
  );

  // Handlers
  const handleAdd = useCallback(async () => {
    const trimmed = addTitle.trim();
    if (!trimmed) return;
    await onCreateSubtask({ title: trimmed, priority: 'Medium' });
    setAddTitle('');
    // Keep input open for rapid entry
    inputRef.current?.focus();
  }, [addTitle, onCreateSubtask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      } else if (e.key === 'Escape') {
        setIsAdding(false);
        setAddTitle('');
      }
    },
    [handleAdd],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortedSubtasks.findIndex((s) => s.id === active.id);
      const newIndex = sortedSubtasks.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...sortedSubtasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      onReorder(reordered.map((s) => s.id));
    },
    [sortedSubtasks, onReorder],
  );

  // ---------- Loading skeleton ----------
  if (isLoading) {
    return (
      <Container>
        <Skeleton>
          <SkeletonLine width="60%" />
          <SkeletonLine width="80%" />
          <SkeletonLine width="50%" />
        </Skeleton>
      </Container>
    );
  }

  // ---------- Error state ----------
  if (error) {
    return (
      <Container>
        <Alert variant="error">{error}</Alert>
      </Container>
    );
  }

  // ---------- Render ----------
  return (
    <Container>
      {/* Progress (only when subtasks exist) */}
      {subtasks.length > 0 && (
        <ProgressRow>
          <SubtaskProgress total={subtasks.length} completed={completedCount} />
        </ProgressRow>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <BulkActionsContainer>
          <SubtaskBulkActions
            selectedCount={selectedIds.size}
            totalCount={subtasks.length}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onDeleteSelected={() => {
              selectedIds.forEach((id) => onDelete(id));
              onDeselectAll();
            }}
            onCompleteSelected={() => {
              selectedIds.forEach((id) => onToggleComplete(id, true));
              onDeselectAll();
            }}
          />
        </BulkActionsContainer>
      )}

      {/* Subtask list with drag-and-drop */}
      {sortedSubtasks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedSubtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div role="list" aria-label="Subtasks">
              {sortedSubtasks.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  isSelected={selectedIds.has(subtask.id)}
                  onToggleComplete={onToggleComplete}
                  onRename={onRename}
                  onDelete={onDelete}
                  onSelect={onToggleSelected}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <EmptyHint>No subtasks yet</EmptyHint>
      )}

      {/* Inline add – Todoist-style */}
      {isAdding ? (
        <InlineInput>
          <AddInput
            ref={inputRef}
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!addTitle.trim()) {
                setIsAdding(false);
              }
            }}
            placeholder="Subtask title..."
            aria-label="New subtask title"
          />
          <AddHint>Enter to add &middot; Esc to close</AddHint>
        </InlineInput>
      ) : (
        <InlineAddRow onClick={() => setIsAdding(true)} role="button" tabIndex={0}>
          <Plus />
          <TextSecondary style={{ fontSize: '13px' }}>Add subtask</TextSecondary>
        </InlineAddRow>
      )}
    </Container>
  );
};
