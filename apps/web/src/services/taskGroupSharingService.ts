import { apiClient } from './api-client';

export type SharePermission = 'View' | 'Edit';

export interface GroupShare {
  sharedWithUserId: string;
  username: string;
  email: string;
  permission: SharePermission;
  createdAt: string;
}

export interface ShareGroupRequest {
  usernameOrEmail: string;
  permission: SharePermission;
}

export const taskGroupSharingService = {
  async getShares(groupId: string): Promise<GroupShare[]> {
    const response = await apiClient.get<GroupShare[]>(`/task-groups/${groupId}/shares`);
    return response.data;
  },

  async shareGroup(groupId: string, request: ShareGroupRequest): Promise<GroupShare> {
    const response = await apiClient.post<GroupShare>(`/task-groups/${groupId}/shares`, request);
    return response.data;
  },

  async unshareGroup(groupId: string, sharedUserId: string): Promise<void> {
    await apiClient.delete(`/task-groups/${groupId}/shares/${sharedUserId}`);
  },
};
