import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsService, type CreateLabelPayload, type UpdateLabelPayload } from '../../services/labelsService';

export const LABELS_KEY = ['labels'] as const;

export function useLabels() {
  return useQuery({
    queryKey: LABELS_KEY,
    queryFn: labelsService.getLabels,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLabelPayload) => labelsService.createLabel(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LABELS_KEY }),
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLabelPayload }) =>
      labelsService.updateLabel(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LABELS_KEY }),
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labelsService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABELS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
