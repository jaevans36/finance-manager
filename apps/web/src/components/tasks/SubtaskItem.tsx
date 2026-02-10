import { memo, useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { borderRadius, spacing, mediaQueries } from '@finance-manager/ui/styles';
import type { Task } from '../../services/taskService';
import { Badge, Flex, TextSmall } from '../ui';

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
// Styled – hover-only actions, clean spacing
// ---------------------------------------------------------------------------

const Row = styled.div<{ $completed: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${borderRadius.md};
  margin-bottom: 2px;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primaryLight : 'transparent'};
  opacity: ${({ $completed }) => ($completed ? 0.6 : 1)};
  transition: background-color 150ms ease;

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.colors.primaryLight : theme.colors.backgroundSecondary};
  }

  /* Show actions and drag handle on hover */
  &:hover [data-actions],
  &:hover [data-drag] {
    opacity: 1;
  }

  ${mediaQueries.tablet} {
    [data-actions],
    [data-drag] {
      opacity: 1;
    }
  }
`;

const DragHandle = styled.span`
  display: flex;
  align-items: center;
  cursor: grab;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 150ms ease;

  &:active {
    cursor: grabbing;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;



const SelectionCheckbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.span<{ $completed: boolean }>`
  flex: 1;
  font-size: 13px;
  color: ${({ theme, $completed }) => ($completed ? theme.colors.textSecondary : theme.colors.text)};
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EditInput = styled.input`
  flex: 1;
  font-size: 13px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${borderRadius.sm};
  padding: 2px ${spacing.sm};
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${spacing.xs};
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color 150ms ease, background-color 150ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const OverdueBadge = styled(Badge)`
  font-size: 10px;
  padding: 2px 6px;
`;

const getPriorityVariant = (priority: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'error';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'success';
    default:
      return 'info';
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
    <Row
      $completed={subtask.completed}
      $selected={isSelected}
      style={style}
      role="listitem"
      aria-label={`Subtask: ${subtask.title}`}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <SelectionCheckbox
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(subtask.id)}
          aria-label={`Select subtask "${subtask.title}"`}
        />
      )}

      {/* Drag handle – visible on hover */}
      <DragHandle data-drag {...dragHandleProps} aria-label="Drag to reorder">
        <GripVertical />
      </DragHandle>

      {/* Title – click to toggle completion, or inline edit */}
      {isEditing ? (
        <EditInput
          ref={editInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleSaveEdit}
          aria-label="Edit subtask title"
        />
      ) : (
        <Title
          $completed={subtask.completed}
          onClick={() => onToggleComplete(subtask.id, !subtask.completed)}
          role="button"
          tabIndex={0}
          aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
        >
          {subtask.title}
        </Title>
      )}

      {/* Metadata */}
      <Flex align="center" gap={6}>
        {/* Only show non-default priority */}
        {subtask.priority !== 'Medium' && (
          <Badge
            variant={getPriorityVariant(subtask.priority)}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            {subtask.priority}
          </Badge>
        )}

        {subtask.dueDate && (
          <TextSmall>
            {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
          </TextSmall>
        )}

        {isOverdue && <OverdueBadge variant="error">Overdue</OverdueBadge>}
      </Flex>

      {/* Actions – visible on hover */}
      <Actions data-actions>
        {isEditing ? (
          <>
            <ActionButton
              onClick={handleSaveEdit}
              aria-label="Save edit"
            >
              <Check />
            </ActionButton>
            <ActionButton
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            >
              <X />
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              onClick={() => {
                setEditValue(subtask.title);
                setIsEditing(true);
              }}
              aria-label={`Edit subtask "${subtask.title}"`}
            >
              <Pencil />
            </ActionButton>
            <ActionButton
              onClick={() => onDelete(subtask.id)}
              aria-label={`Delete subtask "${subtask.title}"`}
            >
              <Trash2 />
            </ActionButton>
          </>
        )}
      </Actions>
    </Row>
  );
});

SubtaskItem.displayName = 'SubtaskItem';
