import { useState } from 'react';
import { X, ListTodo, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import type { CreateEventRequest } from '../../types/event';
import { useCreateTaskForm } from '../../hooks/forms';
import type { CreateTaskInput } from '@finance-manager/schema';

interface QuickAddTaskModalProps {
  date: Date;
  onSubmitTask: (data: { title: string; priority: string; dueDate: string; groupId?: string }) => Promise<void>;
  onSubmitEvent: (data: CreateEventRequest) => Promise<void>;
  onCancel: () => void;
}

export const QuickAddTaskModal = ({ date, onSubmitTask, onSubmitEvent, onCancel }: QuickAddTaskModalProps) => {
  const [type, setType] = useState<'task' | 'event'>('task');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useCreateTaskForm({
    dueDate: date.toISOString().split('T')[0],
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [apiError, setApiError] = useState('');

  const onFormSubmit = async (data: CreateTaskInput) => {
    setApiError('');

    try {
      if (type === 'task') {
        await onSubmitTask({
          title: data.title.trim(),
          priority: data.priority || 'Medium',
          dueDate: data.dueDate || date.toISOString().split('T')[0],
        });
      } else {
        // Event submission
        const eventDate = data.dueDate || date.toISOString().split('T')[0];
        const startDate = isAllDay 
          ? `${eventDate}T00:00:00Z`
          : `${eventDate}T${startTime}:00Z`;
        const endDate = isAllDay
          ? `${eventDate}T23:59:59Z`
          : `${eventDate}T${endTime}:00Z`;

        await onSubmitEvent({
          title: data.title.trim(),
          startDate,
          endDate,
          isAllDay,
        });
      }
      onCancel();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : `Failed to create ${type}`);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[500px] rounded-lg bg-background p-5 shadow-lg md:p-6"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-foreground">Quick Add</h2>
          <button
            onClick={onCancel}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded border-none bg-transparent text-muted-foreground transition-all hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:h-5 [&_svg]:w-5"
          >
            <X />
          </button>
        </div>

        {/* Type Selector */}
        <div className="mb-6 flex gap-2 rounded-lg bg-secondary p-1">
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-all',
              type === 'task'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-foreground hover:bg-card',
            )}
            onClick={() => setType('task')}
          >
            <ListTodo size={16} /> Task
          </button>
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-all',
              type === 'event'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-foreground hover:bg-card',
            )}
            onClick={() => setType('event')}
          >
            <Calendar size={16} /> Event
          </button>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="mb-4 space-y-2">
            <Label htmlFor="item-title">{type === 'task' ? 'Task' : 'Event'} Title *</Label>
            <Input
              id="item-title"
              type="text"
              {...register('title')}
              placeholder={type === 'task' ? 'What needs to be done?' : 'Event name?'}
              maxLength={200}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {type === 'task' ? (
            <>
              <div className="mb-4 space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  {...register('priority')}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="mb-4 space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  {...register('dueDate')}
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  {...register('dueDate')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  All Day Event
                </label>
              </div>

              {!isAllDay && (
                <>
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mb-4 space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1"
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
          </div>
        </form>
      </div>
    </div>
  );
};
