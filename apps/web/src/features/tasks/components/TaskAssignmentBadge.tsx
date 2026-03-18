import { cn } from '@/lib/utils';
import { UserCheck } from 'lucide-react';

interface TaskAssignmentBadgeProps {
  /** The task object is the current user's owner perspective */
  isOwner: boolean;
  assignedToUsername: string | null;
  assignedByUsername: string | null;
  className?: string;
}

export function TaskAssignmentBadge({
  isOwner,
  assignedToUsername,
  assignedByUsername,
  className,
}: TaskAssignmentBadgeProps) {
  if (isOwner && assignedToUsername) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
          className,
        )}
        title={`Assigned to @${assignedToUsername}`}
      >
        <UserCheck size={11} />
        Assigned to @{assignedToUsername}
      </span>
    );
  }

  if (!isOwner && assignedByUsername) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary',
          className,
        )}
        title={`Assigned by @${assignedByUsername}`}
      >
        <UserCheck size={11} />
        From @{assignedByUsername}
      </span>
    );
  }

  return null;
}
