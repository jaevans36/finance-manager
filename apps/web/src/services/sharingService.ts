import { apiClient } from './api-client';

export type EventSharePermission = 'View' | 'Edit' | 'Manage';

export interface EventShare {
  id: string;
  eventId: string;
  sharedWithUserId: string;
  username: string;
  email: string;
  permission: EventSharePermission;
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
}

export interface EventShareInvitation {
  shareId: string;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  eventEndDate: string;
  sharedBy: UserSummary;
  permission: EventSharePermission;
  createdAt: string;
}

export interface CreateEventShareRequest {
  usernameOrEmail: string;
  permission: EventSharePermission;
}

export interface UpdateEventShareRequest {
  permission: EventSharePermission;
}

export const sharingService = {
  async getEventShares(eventId: string): Promise<EventShare[]> {
    const response = await apiClient.get<EventShare[]>(`/events/${eventId}/shares`);
    return response.data;
  },

  async createEventShare(eventId: string, request: CreateEventShareRequest): Promise<EventShare> {
    const response = await apiClient.post<EventShare>(`/events/${eventId}/shares`, request);
    return response.data;
  },

  async updateEventShare(eventId: string, shareId: string, request: UpdateEventShareRequest): Promise<EventShare> {
    const response = await apiClient.put<EventShare>(`/events/${eventId}/shares/${shareId}`, request);
    return response.data;
  },

  async deleteEventShare(eventId: string, shareId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/shares/${shareId}`);
  },

  async getPendingInvitations(): Promise<EventShareInvitation[]> {
    const response = await apiClient.get<EventShareInvitation[]>('/sharing/invitations');
    return response.data;
  },

  async acceptInvitation(shareId: string): Promise<void> {
    await apiClient.post(`/sharing/invitations/${shareId}/accept`, {});
  },

  async declineInvitation(shareId: string): Promise<void> {
    await apiClient.post(`/sharing/invitations/${shareId}/decline`, {});
  },
};
