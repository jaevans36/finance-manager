import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsService, type CreateLabelPayload, type UpdateLabelPayload } from '../../services/labelsService';
import { queryKeys } from '../query-keys';

export function useLabels() {
  return useQuery({
    queryKey: queryKeys.labels.all,
    queryFn: labelsService.getLabels,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLabelPayload) => labelsService.createLabel(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.labels.all }),
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLabelPayload }) =>
      labelsService.updateLabel(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.labels.all }),
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labelsService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
