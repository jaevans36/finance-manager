import { memo } from 'react';
import styled, { useTheme } from 'styled-components';
import { Bell, Calendar, MapPin } from 'lucide-react';
import type { Event } from '../../types/event';
import { Card, Button, Text, TextSmall, Badge, Flex } from '@finance-manager/ui';
import { mediaQueries } from '@finance-manager/ui/styles';
import { REMINDER_OPTIONS } from '../../types/event';

interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

const EventCard = styled(Card)`
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;

  ${mediaQueries.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }
`;

const EventIndicator = styled.div<{ $color?: string }>`
  width: 4px;
  height: 60px;
  background-color: ${({ $color, theme }) => $color || theme.colors.info};
  border-radius: 2px;
  flex-shrink: 0;

  ${mediaQueries.tablet} {
    width: 100%;
    height: 4px;
  }
`;

const EventTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
`;

const EventDescription = styled(Text)`
  margin: 5px 0;
`;

const formatEventDate = (startDate: string, endDate: string, isAllDay: boolean): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const isSameDay = start.toDateString() === end.toDateString();
  
  if (isAllDay) {
    if (isSameDay) {
      return start.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } else {
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }
  
  if (isSameDay) {
    return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return `${start.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
};

const getReminderLabel = (minutes: number | null): string | null => {
  if (!minutes) return null;
  const option = REMINDER_OPTIONS.find(opt => opt.value === minutes);
  return option ? option.label : `${minutes} minutes before`;
};

export const EventItem = memo(({
  event,
  onEdit,
  onDelete,
}: EventItemProps) => {
  const theme = useTheme();
  const isPast = new Date(event.endDate) < new Date();
  const reminderText = getReminderLabel(event.reminderMinutes);

  return (
    <EventCard role="article" aria-label={`Event: ${event.title}`}>
      <EventIndicator $color={event.groupColour || undefined} />

      <div style={{ flex: 1 }}>
        <Flex align="center" gap={10} style={{ marginBottom: '5px' }}>
          <EventTitle>{event.title}</EventTitle>
          {event.groupName && (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: event.groupColour || theme.colors.textSecondary,
                color: event.groupColour || theme.colors.textSecondary
              }}
            >
              {event.groupName}
            </Badge>
          )}
          {event.isAllDay && <Badge variant="info">All Day</Badge>}
          {isPast && <Badge variant="outline">Past</Badge>}
          {reminderText && <Badge variant="warning"><Bell size={12} style={{verticalAlign: 'middle', marginRight: '4px'}} />{reminderText}</Badge>}
        </Flex>

        {event.description && (
          <EventDescription>{event.description}</EventDescription>
        )}

        <TextSmall style={{ marginTop: '5px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {formatEventDate(event.startDate, event.endDate, event.isAllDay)}</span>
          {event.location && (
            <span style={{ marginLeft: '15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {event.location}</span>
          )}
        </TextSmall>
      </div>

      <Flex gap={5}>
        <Button 
          variant="primary" 
          size="small" 
          onClick={() => onEdit(event)}
          aria-label={`Edit event "${event.title}"`}
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="small" 
          onClick={() => onDelete(event.id)}
          aria-label={`Delete event "${event.title}"`}
        >
          Delete
        </Button>
      </Flex>
    </EventCard>
  );
});

EventItem.displayName = 'EventItem';
