import { cn } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { taskGroupService } from '../../services/taskGroupService';
import { useTaskGroupForm } from '../../hooks/forms';
import type { CreateTaskGroupInput } from '@finance-manager/schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { XCircleIcon } from 'lucide-react';
import { useState } from 'react';

const COLOUR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

interface CreateTaskGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskGroupModal = ({
  onClose,
  onSuccess
}: CreateTaskGroupModalProps) => {
  const toast = useToast();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useTaskGroupForm();

  const selectedColour = watch('colour') || COLOUR_OPTIONS[0];

  const onSubmit = async (data: CreateTaskGroupInput) => {
    setApiError(null);

    try {
      await taskGroupService.createGroup({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        colour: data.colour || COLOUR_OPTIONS[0],
      });
      toast.success('Task group created successfully');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create task group';
      setApiError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[500px] overflow-y-auto rounded-lg bg-background p-6 shadow-lg md:w-[95%] md:max-h-[95vh] md:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-5 text-xl font-semibold text-foreground">Create Task Group</h2>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <XCircleIcon className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g., House Renovation"
              maxLength={100}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="mb-4 space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe this group..."
              maxLength={500}
              rows={3}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="mb-4 space-y-2">
            <Label>Colour</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {COLOUR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    'h-10 w-10 cursor-pointer rounded-lg border-[3px] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-12 md:w-12',
                    selectedColour === option ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: option }}
                  onClick={() => setValue('colour', option)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
