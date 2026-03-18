import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sharingService,
  type CreateEventShareRequest,
  type UpdateEventShareRequest,
} from '@/services/sharingService';
import { queryKeys } from '../query-keys';

/** Fetch shares for a given event */
export function useEventShares(eventId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventShares.byEvent(eventId),
    queryFn: () => sharingService.getEventShares(eventId),
    enabled: !!eventId && enabled,
  });
}

/** Fetch pending share invitations for the current user */
export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.eventShares.invitations(),
    queryFn: () => sharingService.getPendingInvitations(),
  });
}

/** Create a new event share */
export function useCreateEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateEventShareRequest) =>
      sharingService.createEventShare(eventId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Update permission on an existing event share */
export function useUpdateEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, request }: { shareId: string; request: UpdateEventShareRequest }) =>
      sharingService.updateEventShare(eventId, shareId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Delete an event share */
export function useDeleteEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.deleteEventShare(eventId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Accept a share invitation */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.acceptInvitation(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.invitations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Decline a share invitation */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.declineInvitation(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.invitations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
