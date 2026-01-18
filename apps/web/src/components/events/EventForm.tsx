import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Card, 
  Button, 
  Input, 
  TextArea, 
  FormGroup, 
  Label, 
  ErrorText, 
  Alert,
  Flex
} from '../ui';
import { XCircle } from 'lucide-react';
import type { Event, CreateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const Subheading = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 20px 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

interface EventFormProps {
  event?: Event;
  onSubmit: (data: CreateEventRequest) => Promise<void>;
  onCancel: () => void;
  groups?: TaskGroup[];
}

export const EventForm = ({ event, onSubmit, onCancel, groups = [] }: EventFormProps) => {
  const isEditing = !!event;
  
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(
    event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ''
  );
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [location, setLocation] = useState(event?.location || '');
  const [reminderMinutes, setReminderMinutes] = useState<string>(
    event?.reminderMinutes?.toString() || ''
  );
  const [groupId, setGroupId] = useState<string>(event?.groupId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-set end date to 1 hour after start if empty
  useEffect(() => {
    if (startDate && !endDate) {
      const start = new Date(startDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
      setEndDate(end.toISOString().slice(0, 16));
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!startDate) {
      setError('Start date is required');
      return;
    }

    if (!endDate) {
      setError('End date is required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isAllDay,
        location: location.trim() || undefined,
        reminderMinutes: reminderMinutes ? parseInt(reminderMinutes, 10) : undefined,
        groupId: groupId || undefined,
      });
      
      if (!isEditing) {
        // Reset form for create mode
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setIsAllDay(false);
        setLocation('');
        setReminderMinutes('');
        setGroupId('');
      }
    } catch (err) {
      console.error('Event operation error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setError(axiosError.response?.data?.error?.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} event`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reminderOptions = [
    { value: '', label: 'No reminder' },
    { value: '15', label: '15 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
    { value: '1440', label: '1 day before' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }} aria-label={`${isEditing ? 'Edit' : 'Create'} event form`}>
      <Card style={{ padding: '20px' }}>
        <Subheading>{isEditing ? 'Edit Event' : 'Create New Event'}</Subheading>

        {error && (
          <Alert variant="error" style={{ marginBottom: '15px' }}>
            <XCircle size={16} />
            <span>{error}</span>
          </Alert>
        )}

        <FormGroup>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            aria-required="true"
            aria-invalid={!!error && !title.trim()}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            maxLength={200}
            disabled={isSubmitting}
          />
          <ErrorText>{title.length}/200</ErrorText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter event description"
            maxLength={5000}
            rows={3}
            disabled={isSubmitting}
          />
          <ErrorText>{description.length}/5000</ErrorText>
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <FormGroup>
            <Label htmlFor="startDate">Start Date & Time *</Label>
            <Input
              id="startDate"
              aria-required="true"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="endDate">End Date & Time *</Label>
            <Input
              id="endDate"
              aria-required="true"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              disabled={isSubmitting}
            />
          </FormGroup>
        </div>

        <FormGroup>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              disabled={isSubmitting}
            />
            All-day event
          </CheckboxLabel>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location (optional)"
            maxLength={500}
            disabled={isSubmitting}
          />
          <ErrorText>{location.length}/500</ErrorText>
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <FormGroup>
            <Label htmlFor="reminder">Reminder</Label>
            <Input
              as="select"
              id="reminder"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value)}
              disabled={isSubmitting}
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="group">Group</Label>
            <Input
              as="select"
              id="group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">No group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Input>
          </FormGroup>
        </div>

        <Flex gap={10}>
          <Button type="submit" variant="success" $isLoading={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </Flex>
      </Card>
    </form>
  );
};
