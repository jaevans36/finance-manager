import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { queryKeys } from '../query-keys';

/** Fetch the current authenticated user's profile */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 60 * 1000, // 1 minute
    retry: false,         // Don't retry auth requests
  });
}
