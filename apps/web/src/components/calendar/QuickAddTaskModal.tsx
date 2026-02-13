import { useState } from 'react';
import styled from 'styled-components';
import { X, ListTodo, Calendar } from 'lucide-react';
import { borderRadius, shadows, mediaQueries, focusRing } from '../../styles/layout';
import { Button, Input, FormGroup, Label, Alert } from '../ui';
import type { CreateEventRequest } from '../../types/event';

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
  border-radius: ${borderRadius.lg};
  padding: 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: ${shadows.elevated};

  ${mediaQueries.tablet} {
    padding: 20px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 20px;
    height: 20px;
  }

  ${focusRing}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const TypeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg};
  padding: 4px;
`;

const TypeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: ${borderRadius.sm};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.cardBackground};
  }
`;

interface QuickAddTaskModalProps {
  date: Date;
  onSubmitTask: (data: { title: string; priority: string; dueDate: string; groupId?: string }) => Promise<void>;
  onSubmitEvent: (data: CreateEventRequest) => Promise<void>;
  onCancel: () => void;
}

export const QuickAddTaskModal = ({ date, onSubmitTask, onSubmitEvent, onCancel }: QuickAddTaskModalProps) => {
  const [type, setType] = useState<'task' | 'event'>('task');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState(date.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (type === 'task') {
        await onSubmitTask({
          title: title.trim(),
          priority,
          dueDate,
        });
      } else {
        // Event submission
        const startDate = isAllDay 
          ? `${dueDate}T00:00:00Z`
          : `${dueDate}T${startTime}:00Z`;
        const endDate = isAllDay
          ? `${dueDate}T23:59:59Z`
          : `${dueDate}T${endTime}:00Z`;

        await onSubmitEvent({
          title: title.trim(),
          startDate,
          endDate,
          isAllDay,
        });
      }
      onCancel();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to create ${type}`);
      setIsSubmitting(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ModalOverlay onClick={onCancel} role="dialog" aria-modal="true">
      <ModalContent onClick={handleModalClick}>
        <ModalHeader>
          <ModalTitle>Quick Add</ModalTitle>
          <CloseButton onClick={onCancel} aria-label="Close modal">
            <X />
          </CloseButton>
        </ModalHeader>

        <TypeSelector>
          <TypeButton $active={type === 'task'} onClick={() => setType('task')} type="button">
            <ListTodo size={16} /> Task
          </TypeButton>
          <TypeButton $active={type === 'event'} onClick={() => setType('event')} type="button">
            <Calendar size={16} /> Event
          </TypeButton>
        </TypeSelector>

        {error && (
          <Alert variant="error" style={{ marginBottom: '16px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="item-title">{type === 'task' ? 'Task' : 'Event'} Title *</Label>
            <Input
              id="item-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'task' ? 'What needs to be done?' : 'Event name?'}
              maxLength={200}
              disabled={isSubmitting}
              autoFocus
            />
          </FormGroup>

          {type === 'task' ? (
            <>
              <FormGroup>
                <Label htmlFor="task-priority">Priority</Label>
                <Input
                  as="select"
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                  disabled={isSubmitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </Input>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </FormGroup>
            </>
          ) : (
            <>
              <FormGroup>
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    disabled={isSubmitting}
                    style={{ marginRight: '8px' }}
                  />
                  All Day Event
                </Label>
              </FormGroup>

              {!isAllDay && (
                <>
                  <FormGroup>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </FormGroup>
                </>
              )}
            </>
          )}

          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              $isLoading={isSubmitting}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Adding...' : `Add ${type === 'task' ? 'Task' : 'Event'}`}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
