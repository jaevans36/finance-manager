import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { TaskGroup } from '../../types/taskGroup';
import { TaskGroupItem } from './TaskGroupItem';
import { GroupSkeleton } from './GroupSkeleton';
import { PlusIcon } from 'lucide-react';
import { CreateTaskGroupModal } from './CreateTaskGroupModal';
import { ShareGroupModal } from './ShareGroupModal';

interface TaskGroupListProps {
  groups: TaskGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onGroupCreated: () => void;
  loading?: boolean;
}

export const TaskGroupList = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onGroupCreated,
  loading = false
}: TaskGroupListProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sharingGroup, setSharingGroup] = useState<TaskGroup | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4 md:p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Task Groups</span>
        </div>
        <GroupSkeleton count={4} />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4 md:p-3"
        role="navigation"
        aria-label="Task groups navigation"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground" id="task-groups-heading">Task Groups</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Create new task group"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>

        <div
          className={cn(
            'mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary md:min-h-12 md:p-3.5',
            selectedGroupId === null && 'bg-secondary',
          )}
          onClick={() => onSelectGroup(null)}
          role="button"
          tabIndex={0}
          aria-label="View all tasks"
          aria-pressed={selectedGroupId === null}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectGroup(null);
            }
          }}
        >
          <span className="text-sm font-medium text-foreground">All Tasks</span>
        </div>

        {groups.map((group) => (
          <TaskGroupItem
            key={group.id}
            group={group}
            isActive={selectedGroupId === group.id}
            onClick={() => onSelectGroup(group.id)}
            onShare={setSharingGroup}
          />
        ))}
      </div>

      {isCreateModalOpen && (
        <CreateTaskGroupModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            onGroupCreated();
          }}
        />
      )}

      {sharingGroup && (
        <ShareGroupModal
          groupId={sharingGroup.id}
          groupName={sharingGroup.name}
          onClose={() => setSharingGroup(null)}
        />
      )}
    </>
  );
};
