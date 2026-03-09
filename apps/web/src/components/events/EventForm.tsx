import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import type { Event, CreateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';
import { useCreateEventForm } from '../../hooks/forms';
import type { CreateEventInput } from '@life-manager/schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="mb-[30px]" aria-label={`${isEditing ? 'Edit' : 'Create'} event form`}>
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="m-0 mb-5 text-foreground">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 space-y-2">
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
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          <p className="text-sm text-muted-foreground">{(watchedTitle ?? '').length}/200</p>
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter event description"
            maxLength={5000}
            rows={3}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">{(watchedDescription ?? '').length}/5000</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date & Time *</Label>
            <Input
              id="startDate"
              aria-required="true"
              type="datetime-local"
              {...register('startDate')}
              disabled={isSubmitting}
            />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date & Time *</Label>
            <Input
              id="endDate"
              aria-required="true"
              type="datetime-local"
              {...register('endDate')}
              min={watchedStartDate}
              disabled={isSubmitting}
            />
            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              {...register('isAllDay')}
              disabled={isSubmitting}
              className="h-[18px] w-[18px] cursor-pointer"
            />
            All-day event
          </label>
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            {...register('location')}
            placeholder="Add location (optional)"
            maxLength={500}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">{(watchedLocation ?? '').length}/500</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reminder">Reminder</Label>
            <select
              id="reminder"
              {...register('reminderMinutes')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <select
              id="group"
              {...register('groupId')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};
