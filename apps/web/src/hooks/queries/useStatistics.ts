import { useQuery, useQueryClient } from '@tanstack/react-query';
import { statisticsService } from '@/services/statisticsService';
import { queryKeys } from '../query-keys';

/** Fetch weekly statistics */
export function useWeeklyStatistics(weekStart?: string) {
  return useQuery({
    queryKey: queryKeys.statistics.weekly(weekStart),
    queryFn: () => statisticsService.getWeeklyStatistics(weekStart),
    staleTime: 5 * 60 * 1000, // 5 minutes — matches previous cache TTL
  });
}

/** Fetch daily statistics */
export function useDailyStatistics(date?: string) {
  return useQuery({
    queryKey: queryKeys.statistics.daily(date),
    queryFn: () => statisticsService.getDailyStatistics(date),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch urgent tasks */
export function useUrgentTasks(weekStart?: string) {
  return useQuery({
    queryKey: queryKeys.statistics.urgent(weekStart),
    queryFn: () => statisticsService.getUrgentTasks(weekStart),
    staleTime: 2 * 60 * 1000, // 2 minutes — urgent data refreshes faster
  });
}

/** Fetch historical statistics */
export function useHistoricalStatistics(weeks = 8) {
  return useQuery({
    queryKey: queryKeys.statistics.historical(weeks),
    queryFn: () => statisticsService.getHistoricalStatistics(weeks),
    staleTime: 10 * 60 * 1000, // 10 minutes — historical data changes slowly
  });
}

/** Hook to invalidate all statistics queries (call after task mutations) */
export function useInvalidateStatistics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
  };
}
