import { useState, useRef, useCallback } from 'react';
import { XCircle, Plus, X } from 'lucide-react';
import { useCreateTaskForm } from '../../hooks/forms';
import type { CreateTaskInput } from '@life-manager/schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { LabelPicker } from '../labels/LabelPicker';

import { TaskGroup } from '../../types/taskGroup';

interface CreateTaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
    groupId?: string;
    subtaskTitles?: string[];
    labelIds?: string[];
  }) => Promise<void>;
  onCancel: () => void;
  groups?: TaskGroup[];
  selectedGroupId?: string | null;
  onSubtasksCreated?: (taskId: string, titles: string[]) => Promise<void>;
}

export const CreateTaskForm = ({ onSubmit, onCancel, groups = [], selectedGroupId, onSubtasksCreated: _onSubtasksCreated }: CreateTaskFormProps) => {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useCreateTaskForm({
    groupId: selectedGroupId || '',
  });
  const [apiError, setApiError] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const watchedTitle = watch('title');

  const handleAddSubtask = useCallback(() => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    setSubtaskTitles((prev) => [...prev, trimmed]);
    setSubtaskInput('');
    subtaskInputRef.current?.focus();
  }, [subtaskInput]);

  const handleRemoveSubtask = useCallback((index: number) => {
    setSubtaskTitles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubtaskKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSubtask();
      }
      if (e.key === 'Escape') {
        setIsAddingSubtask(false);
        setSubtaskInput('');
      }
    },
    [handleAddSubtask],
  );

  const onFormSubmit = async (data: CreateTaskInput) => {
    setApiError('');

    try {
      await onSubmit({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority || undefined,
        dueDate: data.dueDate || undefined,
        groupId: data.groupId || undefined,
        subtaskTitles: subtaskTitles.length > 0 ? subtaskTitles : undefined,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });
      // Reset form
      reset({ title: '', description: '', priority: 'Medium', dueDate: '', groupId: selectedGroupId || '' });
      setSubtaskTitles([]);
      setSubtaskInput('');
      setIsAddingSubtask(false);
      setSelectedLabelIds([]);
    } catch (err: unknown) {
      console.error('Task creation error:', err);
      if (err instanceof Error) {
        setApiError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setApiError(axiosError.response?.data?.error?.message || 'Failed to create task');
      } else {
        setApiError('Failed to create task');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="mb-[30px]" aria-label="Create new task form">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="m-0 mb-5 text-foreground" id="create-task-heading">Create New Task</h2>

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
            placeholder="Enter task title"
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
            placeholder="Enter task description"
            maxLength={2000}
            rows={3}
            disabled={isSubmitting}
          />
        <div className="mb-4 space-y-2">
          <Label htmlFor="group">Group</Label>
          <select
            id="group"
            {...register('groupId')}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              {...register('priority')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <Label>Labels</Label>
          <LabelPicker selectedIds={selectedLabelIds} onChange={setSelectedLabelIds} />
        </div>

        {/* Subtasks section */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <Label className="m-0">Subtasks</Label>
          </div>

          {subtaskTitles.length > 0 && (
            <div className="mb-2 flex flex-col gap-1">
              {subtaskTitles.map((st, index) => (
                <div key={index} className="flex items-center gap-2 rounded bg-secondary px-2 py-1">
                  <span className="flex-1 truncate text-sm text-foreground">{st}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label={`Remove subtask "${st}"`}
                    disabled={isSubmitting}
                    className="flex flex-shrink-0 items-center justify-center rounded border-none bg-transparent p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isAddingSubtask ? (
            <div className="flex items-center gap-2">
              <Input
                ref={subtaskInputRef}
                type="text"
                placeholder="Type a subtask and press Enter..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                onBlur={() => {
                  if (!subtaskInput.trim()) {
                    setIsAddingSubtask(false);
                  }
                }}
                disabled={isSubmitting}
                aria-label="New subtask title"
                autoFocus
                className="flex-1"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSubtask(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1 border-none bg-transparent py-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add subtask
            </button>
          )}
        </div>

        <div className="flex gap-2.5">
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};
