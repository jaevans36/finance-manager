import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import type { EventQueryParams, CreateEventRequest, UpdateEventRequest } from '@/types/event';
import { queryKeys } from '../query-keys';

/** Fetch events with optional filters */
export function useEvents(params?: EventQueryParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params as Record<string, unknown>),
    queryFn: () => eventService.getEvents(params),
  });
}

/** Fetch a single event by ID */
export function useEvent(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventService.getEvent(id),
    enabled: !!id && enabled,
  });
}

/** Fetch events by date range */
export function useEventsByDateRange(
  startDate: string,
  endDate: string,
  groupId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.events.dateRange(startDate, endDate, groupId),
    queryFn: () => eventService.getEventsByDateRange(startDate, endDate, groupId),
    enabled: !!startDate && !!endDate && enabled,
  });
}

/** Create a new event */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

/** Update an existing event */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) =>
      eventService.updateEvent(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
}

/** Delete an event */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
