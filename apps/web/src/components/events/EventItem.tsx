import { memo } from 'react';
import { Bell, Calendar, MapPin } from 'lucide-react';
import type { Event } from '../../types/event';
import { REMINDER_OPTIONS } from '../../types/event';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EventShareBadge } from '../../features/events/components/EventShareBadge';

interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onShare?: (event: Event) => void;
  shareCount?: number;
}

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
  onShare,
  shareCount,
}: EventItemProps) => {
  const isPast = new Date(event.endDate) < new Date();
  const reminderText = getReminderLabel(event.reminderMinutes);

  return (
    <div
      className="mb-2.5 flex items-center gap-[15px] rounded-lg border border-border bg-card p-[15px] md:flex-col md:items-start md:gap-3 md:p-3"
      role="article"
      aria-label={`Event: ${event.title}`}
    >
      <div
        className="h-[60px] w-1 flex-shrink-0 rounded-sm md:h-1 md:w-full"
        style={{ backgroundColor: event.groupColour || '#898989' }}
      />

      <div className="flex-1 min-w-0">
        <div className="mb-[5px] flex flex-wrap items-center gap-2.5">
          <h3 className="m-0 text-base text-foreground">{event.title}</h3>
          {event.groupName && (
            <Badge
              variant="outline"
              style={{
                borderColor: event.groupColour || 'hsl(var(--muted-foreground))',
                color: event.groupColour || 'hsl(var(--muted-foreground))',
              }}
            >
              {event.groupName}
            </Badge>
          )}
          {event.isAllDay && <Badge variant="secondary">All Day</Badge>}
          {isPast && <Badge variant="outline">Past</Badge>}
          {reminderText && (
            <Badge variant="warning">
              <Bell className="mr-1 inline h-3 w-3 align-middle" />{reminderText}
            </Badge>
          )}
          {(shareCount ?? 0) > 0 && <EventShareBadge shareCount={shareCount ?? 0} />}
        </div>

        {event.description && (
          <p className="my-[5px] text-sm text-foreground">{event.description}</p>
        )}

        <p className="mt-[5px] text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatEventDate(event.startDate, event.endDate, event.isAllDay)}</span>
          {event.location && (
            <span className="ml-[15px] inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
          )}
        </p>
      </div>

      <div className="flex gap-[5px]">
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(event)}
            aria-label={`Share event '${event.title}'`}
          >
            Share
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={() => onEdit(event)}
          aria-label={`Edit event "${event.title}"`}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(event.id)}
          aria-label={`Delete event "${event.title}"`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
});

EventItem.displayName = 'EventItem';
