export interface Event {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location: string | null;
  reminderMinutes: number | null;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  location?: string;
  reminderMinutes?: number;
  groupId?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  location?: string;
  reminderMinutes?: number;
  groupId?: string;
}

export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
  groupId?: string;
}

export const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
] as const;
