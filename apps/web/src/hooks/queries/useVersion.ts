import { useQuery } from '@tanstack/react-query';
import { versionService } from '@/services/versionService';
import { queryKeys } from '../query-keys';

/** Fetch current application version */
export function useCurrentVersion() {
  return useQuery({
    queryKey: queryKeys.version.current(),
    queryFn: () => versionService.getCurrentVersion(),
    staleTime: 10 * 60 * 1000, // 10 minutes — version changes rarely
  });
}

/** Fetch version history */
export function useVersionHistory() {
  return useQuery({
    queryKey: queryKeys.version.history(),
    queryFn: () => versionService.getVersionHistory(),
    staleTime: 10 * 60 * 1000,
  });
}
