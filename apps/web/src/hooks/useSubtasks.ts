import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '../services/taskService';
import { subtaskService, type CreateSubtaskInput } from '../services/subtaskService';
import { statisticsService } from '../services/statisticsService';
import { queryKeys } from './query-keys';

interface UseSubtasksReturn {
  subtasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchSubtasks: () => Promise<void>;
  createSubtask: (input: CreateSubtaskInput) => Promise<Task | null>;
  bulkCreateSubtasks: (titles: string[]) => Promise<Task[] | null>;
  toggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>;
  renameSubtask: (subtaskId: string, newTitle: string) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  reorderSubtasks: (orderedIds: string[]) => Promise<void>;
  bulkComplete: () => Promise<void>;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

export const useSubtasks = (
  parentTaskId: string,
  onSubtaskChange?: (taskId: string, counts: { subtaskCount: number; completedSubtaskCount: number }) => void,
): UseSubtasksReturn => {
  const queryClient = useQueryClient();
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSubtasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subtaskService.getSubtasks(parentTaskId);
      setSubtasks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subtasks';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const createSubtask = useCallback(
    async (input: CreateSubtaskInput): Promise<Task | null> => {
      try {
        const newSubtask = await subtaskService.createSubtask(parentTaskId, input);
        setSubtasks((prev) => [...prev, newSubtask]);
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        return newSubtask;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create subtask';
        setError(message);
        return null;
      }
    },
    [parentTaskId],
  );

  const bulkCreateSubtasks = useCallback(
    async (titles: string[]): Promise<Task[] | null> => {
      try {
        const newSubtasks = await subtaskService.bulkCreateSubtasks(parentTaskId, titles);
        setSubtasks((prev) => [...prev, ...newSubtasks]);
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        return newSubtasks;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create subtasks';
        setError(message);
        return null;
      }
    },
    [parentTaskId],
  );

  const toggleSubtask = useCallback(
    async (subtaskId: string, completed: boolean) => {
      // Optimistic update
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId
            ? { ...s, completed, completedAt: completed ? new Date().toISOString() : null }
            : s,
        ),
      );

      try {
        const { taskService } = await import('../services/taskService');
        await taskService.toggleTask(subtaskId, completed);
        statisticsService.invalidateCache();
        // Invalidate task caches so parent task counts refresh across all pages
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      } catch (err: unknown) {
        // Revert optimistic update
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === subtaskId
              ? { ...s, completed: !completed, completedAt: !completed ? new Date().toISOString() : null }
              : s,
          ),
        );
        const message = err instanceof Error ? err.message : 'Failed to toggle subtask';
        setError(message);
      }
    },
    [],
  );

  const renameSubtask = useCallback(
    async (subtaskId: string, newTitle: string) => {
      const previousSubtasks = subtasks;
      // Optimistic update
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId ? { ...s, title: newTitle } : s,
        ),
      );

      try {
        const { taskService } = await import('../services/taskService');
        await taskService.updateTask(subtaskId, { title: newTitle });
      } catch (err: unknown) {
        // Revert on failure
        setSubtasks(previousSubtasks);
        const message = err instanceof Error ? err.message : 'Failed to rename subtask';
        setError(message);
      }
    },
    [subtasks],
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string) => {
      const previousSubtasks = subtasks;
      // Optimistic removal
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(subtaskId);
        return next;
      });

      try {
        const { taskService } = await import('../services/taskService');
        await taskService.deleteTask(subtaskId);
        statisticsService.invalidateCache();
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      } catch (err: unknown) {
        // Revert on failure
        setSubtasks(previousSubtasks);
        const message = err instanceof Error ? err.message : 'Failed to delete subtask';
        setError(message);
      }
    },
    [subtasks],
  );

  const reorderSubtasks = useCallback(
    async (orderedIds: string[]) => {
      const previousSubtasks = subtasks;
      // Optimistic reorder
      const reorderedMap = new Map(subtasks.map((s) => [s.id, s]));
      const reordered = orderedIds
        .map((id) => reorderedMap.get(id))
        .filter((s): s is Task => s !== undefined);
      setSubtasks(reordered);

      try {
        await subtaskService.reorderSubtasks(parentTaskId, orderedIds);
      } catch (err: unknown) {
        setSubtasks(previousSubtasks);
        const message = err instanceof Error ? err.message : 'Failed to reorder subtasks';
        setError(message);
      }
    },
    [parentTaskId, subtasks],
  );

  const bulkComplete = useCallback(async () => {
    const previousSubtasks = subtasks;
    // Optimistic: mark all as complete
    setSubtasks((prev) =>
      prev.map((s) => ({ ...s, completed: true, completedAt: new Date().toISOString() })),
    );

    try {
      await subtaskService.bulkCompleteSubtasks(parentTaskId);
      statisticsService.invalidateCache();
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    } catch (err: unknown) {
      setSubtasks(previousSubtasks);
      const message = err instanceof Error ? err.message : 'Failed to complete subtasks';
      setError(message);
    }
  }, [parentTaskId, subtasks]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(subtasks.map((s) => s.id)));
  }, [subtasks]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Notify parent whenever subtask counts change
  useEffect(() => {
    if (!isLoading) {
      const completedCount = subtasks.filter((s) => s.completed).length;
      onSubtaskChange?.(parentTaskId, {
        subtaskCount: subtasks.length,
        completedSubtaskCount: completedCount,
      });
    }
  }, [subtasks, isLoading, parentTaskId, onSubtaskChange]);

  return {
    subtasks,
    isLoading,
    error,
    fetchSubtasks,
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
  };
};
