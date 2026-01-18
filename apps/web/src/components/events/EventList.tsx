import styled from 'styled-components';
import type { Event } from '../../types/event';
import { EventItem } from './EventItem';
import { Card, Text, TextSecondary } from '../ui';

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

const EmptyState = styled(Card)`
  text-align: center;
  padding: 60px 20px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SectionHeader = styled.h3`
  margin: 20px 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const EventList = ({
  events,
  isLoading,
  onEdit,
  onDelete,
}: EventListProps) => {
  if (isLoading) {
    return <LoadingState role="status" aria-live="polite">Loading events...</LoadingState>;
  }

  if (events.length === 0) {
    return (
      <EmptyState role="status">
        <Text style={{ marginBottom: '10px' }}>No events yet</Text>
        <TextSecondary>Create your first event to get started!</TextSecondary>
      </EmptyState>
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
          <SectionHeader>Today</SectionHeader>
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
          <SectionHeader>Tomorrow</SectionHeader>
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
          <SectionHeader>This Week</SectionHeader>
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
          <SectionHeader>Later</SectionHeader>
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
          <SectionHeader>Past Events</SectionHeader>
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
