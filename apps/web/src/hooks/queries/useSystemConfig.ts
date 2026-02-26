import { useQuery } from '@tanstack/react-query';
import { systemConfigurationService } from '@/services/systemConfigurationService';
import { queryKeys } from '../query-keys';

/** Fetch system configuration (admin) */
export function useSystemConfig() {
  return useQuery({
    queryKey: queryKeys.systemConfig.all,
    queryFn: () => systemConfigurationService.getConfiguration(),
    staleTime: 60 * 1000, // 1 minute
  });
}
