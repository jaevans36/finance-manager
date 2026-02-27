import { EventForm } from './EventForm';
import { eventService } from '../../services/eventService';
import type { Event, CreateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

interface EditEventModalProps {
  event: Event;
  onSubmit: (event: Event) => void;
  onCancel: () => void;
  groups?: TaskGroup[];
}

export const EditEventModal = ({ 
  event, 
  onSubmit, 
  onCancel, 
  groups = [] 
}: EditEventModalProps) => {
  const handleSubmit = async (data: CreateEventRequest) => {
    try {
      const updatedEvent = await eventService.updateEvent(event.id, data);
      onSubmit(updatedEvent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update event';
      throw new Error(message);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[600px] overflow-y-auto rounded-lg bg-background shadow-lg md:max-w-[95%]"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <EventForm
          event={event}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          groups={groups}
        />
      </div>
    </div>
  );
};
