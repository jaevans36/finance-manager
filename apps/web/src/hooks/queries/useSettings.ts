import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, type UpdateUserSettingsInput } from '@/services/settingsService';
import { queryKeys } from '../query-keys';

/** Fetch user settings */
export function useUserSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: () => settingsService.getSettings(),
    enabled,
  });
}

/** Update user settings */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserSettingsInput) => settingsService.updateSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}

/** Fetch WIP summary */
export function useWipSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.settings.wipSummary(),
    queryFn: () => settingsService.getWipSummary(),
    enabled,
  });
}
