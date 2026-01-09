import { useState } from 'react';
import styled from 'styled-components';
import { TaskGroup } from '../../types/taskGroup';
import { TaskGroupItem } from './TaskGroupItem';
import { GroupSkeleton } from './GroupSkeleton';
import { Button, Text, Flex } from '../ui';
import { PlusIcon } from 'lucide-react';
import { CreateTaskGroupModal } from './CreateTaskGroupModal';

const GroupListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const GroupListHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AllTasksButton = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.backgroundSecondary : 'transparent'};
  margin-bottom: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  @media (max-width: 768px) {
    padding: 14px;
    min-height: 48px;
  }
`;

interface TaskGroupListProps {
  groups: TaskGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onGroupCreated: () => void;
  loading?: boolean;
}

export const TaskGroupList: React.FC<TaskGroupListProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onGroupCreated,
  loading = false
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (loading) {
    return (
      <GroupListContainer>
        <GroupListHeader>
          <Text style={{ fontWeight: 600 }}>Task Groups</Text>
        </GroupListHeader>
        <GroupSkeleton count={4} />
      </GroupListContainer>
    );
  }

  return (
    <>
      <GroupListContainer role="navigation" aria-label="Task groups navigation">
        <GroupListHeader>
          <Text style={{ fontWeight: 600 }} id="task-groups-heading">Task Groups</Text>
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Create new task group"
          >
            <PlusIcon size={16} />
          </Button>
        </GroupListHeader>

        <AllTasksButton
          $isActive={selectedGroupId === null}
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
          <Text style={{ fontWeight: 500 }}>All Tasks</Text>
        </AllTasksButton>

        {groups.map((group) => (
          <TaskGroupItem
            key={group.id}
            group={group}
            isActive={selectedGroupId === group.id}
            onClick={() => onSelectGroup(group.id)}
          />
        ))}
      </GroupListContainer>

      {isCreateModalOpen && (
        <CreateTaskGroupModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            onGroupCreated();
          }}
        />
      )}
    </>
  );
};
