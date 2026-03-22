import { apiClient } from './api-client';

export interface Label {
  id: string;
  name: string;
  colourHex: string;
}

export interface CreateLabelPayload {
  name: string;
  colourHex: string;
}

export interface UpdateLabelPayload {
  name?: string;
  colourHex?: string;
}

export const labelsService = {
  getLabels: async (): Promise<Label[]> => {
    const response = await apiClient.get<Label[]>('/labels');
    return response.data;
  },

  createLabel: async (payload: CreateLabelPayload): Promise<Label> => {
    const response = await apiClient.post<Label>('/labels', payload);
    return response.data;
  },

  updateLabel: async (id: string, payload: UpdateLabelPayload): Promise<Label> => {
    const response = await apiClient.put<Label>(`/labels/${id}`, payload);
    return response.data;
  },

  deleteLabel: async (id: string): Promise<void> => {
    await apiClient.delete(`/labels/${id}`);
  },
};
