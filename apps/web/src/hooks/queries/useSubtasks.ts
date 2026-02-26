import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subtaskService, type CreateSubtaskInput } from '@/services/subtaskService';
import { queryKeys } from '../query-keys';

/** Fetch subtasks for a parent task */
export function useSubtasks(taskId: string, includeNested = false) {
  return useQuery({
    queryKey: queryKeys.subtasks.byTask(taskId),
    queryFn: () => subtaskService.getSubtasks(taskId, includeNested),
    enabled: !!taskId,
  });
}

/** Fetch subtask progress for a parent task */
export function useSubtaskProgress(taskId: string) {
  return useQuery({
    queryKey: queryKeys.subtasks.progress(taskId),
    queryFn: () => subtaskService.getProgress(taskId),
    enabled: !!taskId,
  });
}

/** Create a single subtask */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: CreateSubtaskInput }) =>
      subtaskService.createSubtask(taskId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subtasks.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Bulk create subtasks from an array of titles */
export function useBulkCreateSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, titles }: { taskId: string; titles: string[] }) =>
      subtaskService.bulkCreateSubtasks(taskId, titles),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subtasks.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Reorder subtasks */
export function useReorderSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, orderedIds }: { taskId: string; orderedIds: string[] }) =>
      subtaskService.reorderSubtasks(taskId, orderedIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subtasks.byTask(variables.taskId) });
    },
  });
}

/** Move a subtask to a different parent */
export function useMoveSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
      newParentId,
    }: {
      taskId: string;
      subtaskId: string;
      newParentId: string;
    }) => subtaskService.moveSubtask(taskId, subtaskId, newParentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subtasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Bulk complete all subtasks of a parent */
export function useBulkCompleteSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => subtaskService.bulkCompleteSubtasks(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subtasks.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}
