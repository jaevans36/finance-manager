/**
 * Centralised query key factory for TanStack Query.
 *
 * Provides structured, consistent cache keys across the application.
 * Each domain exposes an `all` key (for broad invalidation) and
 * more specific keys for individual queries.
 *
 * @example
 *   queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
 *   queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
 */
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.tasks.lists(), params] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    matrix: (params?: Record<string, unknown>) => [...queryKeys.tasks.all, 'matrix', params] as const,
    suggestion: (id: string) => [...queryKeys.tasks.all, 'suggestion', id] as const,
    autoClassify: () => [...queryKeys.tasks.all, 'auto-classify'] as const,
    suggestions: (params?: Record<string, unknown>) => [...queryKeys.tasks.all, 'suggestions', params] as const,
    energyDistribution: () => [...queryKeys.tasks.all, 'energy-distribution'] as const,
  },

  subtasks: {
    all: ['subtasks'] as const,
    byTask: (taskId: string) => [...queryKeys.subtasks.all, taskId] as const,
    progress: (taskId: string) => [...queryKeys.subtasks.all, taskId, 'progress'] as const,
  },

  taskGroups: {
    all: ['taskGroups'] as const,
    lists: () => [...queryKeys.taskGroups.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.taskGroups.all, id] as const,
  },

  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.events.lists(), params] as const,
    detail: (id: string) => [...queryKeys.events.all, id] as const,
    dateRange: (startDate: string, endDate: string, groupId?: string) =>
      [...queryKeys.events.all, 'range', startDate, endDate, groupId] as const,
  },

  statistics: {
    all: ['statistics'] as const,
    weekly: (weekStart?: string) => [...queryKeys.statistics.all, 'weekly', weekStart] as const,
    daily: (date?: string) => [...queryKeys.statistics.all, 'daily', date] as const,
    urgent: (weekStart?: string) => [...queryKeys.statistics.all, 'urgent', weekStart] as const,
    historical: (weeks?: number) => [...queryKeys.statistics.all, 'historical', weeks] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    stats: () => [...queryKeys.users.all, 'stats'] as const,
  },

  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
  },

  systemConfig: {
    all: ['systemConfig'] as const,
  },

  version: {
    all: ['version'] as const,
    current: () => [...queryKeys.version.all, 'current'] as const,
    history: () => [...queryKeys.version.all, 'history'] as const,
  },

  settings: {
    all: ['settings'] as const,
    current: () => [...queryKeys.settings.all, 'current'] as const,
    wipSummary: () => [...queryKeys.settings.all, 'wip-summary'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.notifications.lists(), params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  eventShares: {
    all: ['eventShares'] as const,
    byEvent: (eventId: string) => [...queryKeys.eventShares.all, eventId] as const,
    invitations: () => [...queryKeys.eventShares.all, 'invitations'] as const,
  },
} as const;
