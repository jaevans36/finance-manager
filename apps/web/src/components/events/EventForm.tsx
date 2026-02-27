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
} from '@finance-manager/ui';
import { XCircle } from 'lucide-react';
import type { Event, CreateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';
import { useCreateEventForm } from '../../hooks/forms';
import type { CreateEventInput } from '@finance-manager/schema';

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
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useCreateEventForm({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    isAllDay: event?.isAllDay || false,
    location: event?.location || '',
    reminderMinutes: event?.reminderMinutes ?? undefined,
    groupId: event?.groupId || '',
  });

  const [apiError, setApiError] = useState('');

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedLocation = watch('location');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  // Auto-set end date to 1 hour after start if empty
  useEffect(() => {
    if (watchedStartDate && !watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
      setValue('endDate', end.toISOString().slice(0, 16));
    }
  }, [watchedStartDate, watchedEndDate, setValue]);

  const onFormSubmit = async (data: CreateEventInput) => {
    setApiError('');

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    try {
      await onSubmit({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isAllDay: data.isAllDay,
        location: data.location?.trim() || undefined,
        reminderMinutes: data.reminderMinutes ?? undefined,
        groupId: data.groupId || undefined,
      });
      
      if (!isEditing) {
        reset();
      }
    } catch (err: unknown) {
      console.error('Event operation error:', err);
      if (err instanceof Error) {
        setApiError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setApiError(axiosError.response?.data?.error?.message || `Failed to ${isEditing ? 'update' : 'create'} event`);
      } else {
        setApiError(`Failed to ${isEditing ? 'update' : 'create'} event`);
      }
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
    <form onSubmit={handleSubmit(onFormSubmit)} style={{ marginBottom: '30px' }} aria-label={`${isEditing ? 'Edit' : 'Create'} event form`}>
      <Card style={{ padding: '20px' }}>
        <Subheading>{isEditing ? 'Edit Event' : 'Create New Event'}</Subheading>

        {apiError && (
          <Alert variant="error" style={{ marginBottom: '15px' }}>
            <XCircle size={16} />
            <span>{apiError}</span>
          </Alert>
        )}

        <FormGroup>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            aria-required="true"
            aria-invalid={!!errors.title}
            type="text"
            {...register('title')}
            placeholder="Enter event title"
            maxLength={200}
            disabled={isSubmitting}
          />
          {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
          <ErrorText>{(watchedTitle ?? '').length}/200</ErrorText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            {...register('description')}
            placeholder="Enter event description"
            maxLength={5000}
            rows={3}
            disabled={isSubmitting}
          />
          <ErrorText>{(watchedDescription ?? '').length}/5000</ErrorText>
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <FormGroup>
            <Label htmlFor="startDate">Start Date & Time *</Label>
            <Input
              id="startDate"
              aria-required="true"
              type="datetime-local"
              {...register('startDate')}
              disabled={isSubmitting}
            />
            {errors.startDate && <ErrorText>{errors.startDate.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="endDate">End Date & Time *</Label>
            <Input
              id="endDate"
              aria-required="true"
              type="datetime-local"
              {...register('endDate')}
              min={watchedStartDate}
              disabled={isSubmitting}
            />
            {errors.endDate && <ErrorText>{errors.endDate.message}</ErrorText>}
          </FormGroup>
        </div>

        <FormGroup>
          <CheckboxLabel>
            <input
              type="checkbox"
              {...register('isAllDay')}
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
            {...register('location')}
            placeholder="Add location (optional)"
            maxLength={500}
            disabled={isSubmitting}
          />
          <ErrorText>{(watchedLocation ?? '').length}/500</ErrorText>
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <FormGroup>
            <Label htmlFor="reminder">Reminder</Label>
            <Input
              as="select"
              id="reminder"
              {...register('reminderMinutes')}
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
              {...register('groupId')}
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
          <Button type="submit" variant="primary" $isLoading={isSubmitting}>
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
