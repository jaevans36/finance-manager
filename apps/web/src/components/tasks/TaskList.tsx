import { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Task } from '../../services/taskService';
import { TaskItem } from './TaskItem';
import { SubtaskList } from './SubtaskList';
import { useSubtasks } from '../../hooks/useSubtasks';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onSubtaskChange?: (taskId: string, counts: { subtaskCount: number; completedSubtaskCount: number }) => void;
}

const EXPANDED_STORAGE_KEY = 'life-manager:expanded-subtasks';

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

/** Wrapper that renders the SubtaskList for a single parent task */
const SubtaskListContainer = ({
  parentTask,
  onSubtaskChange,
}: {
  parentTask: Task;
  onSubtaskChange?: (taskId: string, counts: { subtaskCount: number; completedSubtaskCount: number }) => void;
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
  } = useSubtasks(parentTask.id, onSubtaskChange);

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
  onSubtaskChange,
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
    return (
      <div className="py-10 text-center text-muted-foreground" role="status" aria-live="polite">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary px-5 py-[60px] text-center" role="status">
        <p className="mb-2.5 text-sm text-foreground">No tasks yet</p>
        <p className="text-sm text-muted-foreground">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div role="list" aria-label={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}>
      {tasks.map((task) => {
        const isExpanded = expandedIds.has(task.id);

        return (
          <div
            key={task.id}
            className={cn(
              'mb-2.5 overflow-hidden rounded-lg',
              isExpanded && 'border border-border bg-card',
            )}
          >
            <TaskItem
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isSubtaskExpanded={isExpanded}
              onToggleSubtaskExpand={handleToggleExpand}
            />
            {isExpanded && (
              <div className="border-t border-border px-3 pb-3 pt-2">
                <SubtaskListContainer
                  parentTask={task}
                  onSubtaskChange={onSubtaskChange}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
