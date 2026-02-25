import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Task } from '../../services/taskService';
import { TaskItem } from './TaskItem';
import { SubtaskList } from './SubtaskList';
import { useSubtasks } from '../../hooks/useSubtasks';
import { Card, Text, TextSecondary } from '@finance-manager/ui';
import { spacing, borderRadius } from '@finance-manager/ui/styles';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const EXPANDED_STORAGE_KEY = 'finance-manager:expanded-subtasks';

/** Read persisted expanded task IDs from localStorage */
const readExpandedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // Ignore corrupt localStorage data
  }
  return new Set();
};

/** Persist expanded task IDs to localStorage */
const writeExpandedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Silently ignore quota errors
  }
};

const TaskGroup = styled.div<{ $expanded: boolean }>`
  margin-bottom: 10px;
  border-radius: ${borderRadius.lg};
  overflow: hidden;

  ${({ $expanded, theme }) =>
    $expanded
      ? `
    border: 1px solid ${theme.colors.cardBorder};
    background: ${theme.colors.cardBackground};
  `
      : ''}
`;

const SubtaskPanel = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${spacing.sm} ${spacing.md} ${spacing.md};
`;

const EmptyState = styled(Card)`
  text-align: center;
  padding: 60px 20px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** Wrapper that renders the SubtaskList for a single parent task */
const SubtaskListContainer = ({
  parentTask,
}: {
  parentTask: Task;
}) => {
  const {
    subtasks,
    isLoading,
    error,
    createSubtask,
    bulkCreateSubtasks,
    toggleSubtask,
    renameSubtask,
    deleteSubtask,
    reorderSubtasks,
    bulkComplete,
    selectedIds,
    toggleSelected,
    selectAll,
    deselectAll,
  } = useSubtasks(parentTask.id);

  return (
    <SubtaskList
      parentTask={parentTask}
      subtasks={subtasks}
      isLoading={isLoading}
      error={error}
      onCreateSubtask={createSubtask}
      onBulkCreate={bulkCreateSubtasks}
      onToggleComplete={toggleSubtask}
      onRename={renameSubtask}
      onDelete={deleteSubtask}
      onReorder={reorderSubtasks}
      onBulkComplete={bulkComplete}
      selectedIds={selectedIds}
      onToggleSelected={toggleSelected}
      onSelectAll={selectAll}
      onDeselectAll={deselectAll}
    />
  );
};

export const TaskList = ({
  tasks,
  isLoading,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskListProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(readExpandedIds);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      writeExpandedIds(next);
      return next;
    });
  }, []);

  if (isLoading) {
    return <LoadingState role="status" aria-live="polite">Loading tasks...</LoadingState>;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState role="status">
        <Text style={{ marginBottom: '10px' }}>No tasks yet</Text>
        <TextSecondary>Create your first task to get started!</TextSecondary>
      </EmptyState>
    );
  }

  return (
    <div role="list" aria-label={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}>
      {tasks.map((task) => {
        const isExpanded = expandedIds.has(task.id);

        return (
          <TaskGroup key={task.id} $expanded={isExpanded}>
            <TaskItem
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isSubtaskExpanded={isExpanded}
              onToggleSubtaskExpand={handleToggleExpand}
            />
            {isExpanded && (
              <SubtaskPanel>
                <SubtaskListContainer
                  parentTask={task}
                />
              </SubtaskPanel>
            )}
          </TaskGroup>
        );
      })}
    </div>
  );
};
