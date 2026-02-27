import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { TaskGroup } from '../../types/taskGroup';
import { FolderIcon } from 'lucide-react';

interface TaskGroupItemProps {
  group: TaskGroup;
  isActive: boolean;
  onClick: () => void;
}

export const TaskGroupItem = ({ group, isActive, onClick }: TaskGroupItemProps) => {
  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary',
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
      <FolderIcon size={18} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{group.name}</span>
      </div>
      <Badge variant="outline" aria-label={`${group.taskCount} tasks`}>{group.taskCount}</Badge>
    </div>
  );
};
