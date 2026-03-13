import { apiClient } from './api-client';

export type NotificationType =
  | 'TaskAssigned'
  | 'TaskUnassigned'
  | 'TaskCompletedByAssignee'
  | 'EventShareInvitation'
  | 'EventShareAccepted'
  | 'EventShareDeclined';

export interface Notification {
  id: string;
  type: NotificationType;
  entityId: string;
  entityTitle: string;
  fromUserId: string;
  fromUsername: string;
  isRead: boolean;
  createdAt: string;
  /** Present when type is EventShareInvitation — the shareId to accept/decline */
  shareId?: string;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(params?: NotificationListParams): Promise<Notification[]> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    const response = await apiClient.get<Notification[]>(`/notifications${queryString}`);
    return response.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`, {});
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all', {});
  },
};
