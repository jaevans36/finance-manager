import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskGroupService } from '@/services/taskGroupService';
import type { CreateTaskGroupRequest, UpdateTaskGroupRequest } from '@/types/taskGroup';
import { queryKeys } from '../query-keys';

/** Fetch all task groups */
export function useTaskGroups() {
  return useQuery({
    queryKey: queryKeys.taskGroups.lists(),
    queryFn: () => taskGroupService.getGroups(),
  });
}

/** Fetch a single task group */
export function useTaskGroup(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskGroups.detail(id),
    queryFn: () => taskGroupService.getGroup(id),
    enabled: !!id && enabled,
  });
}

/** Create a task group */
export function useCreateTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskGroupRequest) => taskGroupService.createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskGroups.all });
    },
  });
}

/** Update a task group */
export function useUpdateTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskGroupRequest }) =>
      taskGroupService.updateGroup(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskGroups.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskGroups.lists() });
    },
  });
}

/** Delete a task group */
export function useDeleteTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskGroupService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskGroups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
