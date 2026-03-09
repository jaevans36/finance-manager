import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { TaskGroup } from '../../types/taskGroup';
import { FolderIcon, Share2, Users } from 'lucide-react';

interface TaskGroupItemProps {
  group: TaskGroup;
  isActive: boolean;
  onClick: () => void;
  onShare?: (group: TaskGroup) => void;
}

export const TaskGroupItem = ({ group, isActive, onClick, onShare }: TaskGroupItemProps) => {
  const isSharedWithMe = !!group.sharedPermission;
  const isOwned = !isSharedWithMe;

  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary',
        isActive && 'bg-secondary',
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${group.name} group with ${group.taskCount} tasks`}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: group.colour }}
        aria-hidden="true"
      />
      {isSharedWithMe ? (
        <Users size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      ) : (
        <FolderIcon size={18} aria-hidden="true" className="shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{group.name}</span>
        {isSharedWithMe && group.sharedByUsername && (
          <span className="block truncate text-xs text-muted-foreground">
            {group.sharedPermission} · by {group.sharedByUsername}
          </span>
        )}
      </div>
      <Badge variant="outline" aria-label={`${group.taskCount} tasks`}>{group.taskCount}</Badge>
      {isOwned && !group.isDefault && onShare && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(group); }}
          className="hidden shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary group-hover:flex"
          title="Share group"
          aria-label={`Share ${group.name} group`}
        >
          <Share2 size={14} />
        </button>
      )}
    </div>
  );
};
