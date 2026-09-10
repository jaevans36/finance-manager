/**
 * Mirrors apps/life-api/Features/Events/DTOs/EventDtos.cs (EventDto).
 * life-api events have NO recurrence — there is no RRULE field and no deleteMode.
 */
export interface EventDto {
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
  isOwner: boolean;
  sharedBy: { id: string; username: string } | null;
  myPermission: string | null;
}

/** POST /api/v1/events body. */
export interface CreateEventInput {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  isAllDay?: boolean;
  location?: string;
  reminderMinutes?: number;
  groupId?: string;
}

/** PUT /api/v1/events/{id} body — life-api merges field-by-field (omitted = unchanged). */
export interface UpdateEventInput {
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isAllDay?: boolean;
  location?: string;
  reminderMinutes?: number;
  groupId?: string;
}
