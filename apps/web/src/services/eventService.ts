import { apiClient } from './api-client';
import type { Event, CreateEventRequest, UpdateEventRequest, EventQueryParams } from '../types/event';

export const eventService = {
  async getEvents(params?: EventQueryParams): Promise<Event[]> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    
    const response = await apiClient.get<Event[]>(`/events${queryString}`);
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<Event>('/events', data);
    return response.data;
  },

  async updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.put<Event>(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },

  async getEventsByDateRange(startDate: string, endDate: string, groupId?: string): Promise<Event[]> {
    return this.getEvents({ startDate, endDate, groupId });
  },
};
