import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/contexts/ToastContext';
import { taskService, type Task } from '@/services/taskService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/query-keys';

interface AssignTaskModalProps {
  task: Task;
  onClose: () => void;
}

export function AssignTaskModal({ task, onClose }: AssignTaskModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = usernameOrEmail.trim();
    if (!value) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await taskService.assignTask(task.id, value);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task assigned successfully');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await taskService.unassignTask(task.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Assignment removed');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unassign task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current assignee */}
          {task.assignedToUsername && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Currently assigned to</p>
                <p className="text-sm text-muted-foreground">@{task.assignedToUsername}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={isSubmitting}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <UserMinus size={14} />
                Unassign
              </Button>
            </div>
          )}

          {/* Assign form */}
          <form onSubmit={handleAssign} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="assign-user">
                {task.assignedToUsername ? 'Reassign to' : 'Assign to'}
              </Label>
              <Input
                id="assign-user"
                placeholder="Username or email address"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !usernameOrEmail.trim()}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {task.assignedToUsername ? 'Reassign' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
