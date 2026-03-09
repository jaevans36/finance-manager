import type { Event } from '../../types/event';
import { EventItem } from './EventItem';

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

export const EventList = ({
  events,
  isLoading,
  onEdit,
  onDelete,
}: EventListProps) => {
  if (isLoading) {
    return (
      <div className="py-10 text-center text-muted-foreground" role="status" aria-live="polite">
        Loading events...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-secondary px-5 py-[60px] text-center" role="status">
        <p className="mb-2.5 text-sm text-foreground">No events yet</p>
        <p className="text-sm text-muted-foreground">Create your first event to get started!</p>
      </div>
    );
  }

  // Group events by date category
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingEvents = events.filter(e => new Date(e.startDate) >= today);
  const pastEvents = events.filter(e => new Date(e.endDate) < today);

  const todayEvents = upcomingEvents.filter(e => {
    const start = new Date(e.startDate);
    return start >= today && start < tomorrow;
  });

  const tomorrowEvents = upcomingEvents.filter(e => {
    const start = new Date(e.startDate);
    return start >= tomorrow && start < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
  });

  const thisWeekEvents = upcomingEvents.filter(e => {
    const start = new Date(e.startDate);
    return start >= tomorrow && start < nextWeek && !tomorrowEvents.includes(e);
  });

  const laterEvents = upcomingEvents.filter(e => {
    const start = new Date(e.startDate);
    return start >= nextWeek;
  });

  return (
    <div role="list" aria-label={`${events.length} event${events.length !== 1 ? 's' : ''}`}>
      {todayEvents.length > 0 && (
        <>
          <h3 className="mx-0 mb-2.5 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Today</h3>
          {todayEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {tomorrowEvents.length > 0 && (
        <>
          <h3 className="mx-0 mb-2.5 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tomorrow</h3>
          {tomorrowEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {thisWeekEvents.length > 0 && (
        <>
          <h3 className="mx-0 mb-2.5 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">This Week</h3>
          {thisWeekEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {laterEvents.length > 0 && (
        <>
          <h3 className="mx-0 mb-2.5 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Later</h3>
          {laterEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}

      {pastEvents.length > 0 && (
        <>
          <h3 className="mx-0 mb-2.5 mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Past Events</h3>
          {pastEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </div>
  );
};
