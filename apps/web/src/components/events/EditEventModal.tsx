import styled from 'styled-components';
import { EventForm } from './EventForm';
import { eventService } from '../../services/eventService';
import type { Event, CreateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    max-width: 95%;
  }
`;

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
    <ModalOverlay onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <EventForm
          event={event}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          groups={groups}
        />
      </ModalContent>
    </ModalOverlay>
  );
};
