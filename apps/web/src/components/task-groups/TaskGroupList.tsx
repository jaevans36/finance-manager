import React, { useState } from 'react';
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
      <GroupListContainer>
        <GroupListHeader>
          <Text style={{ fontWeight: 600 }}>Task Groups</Text>
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
          </Button>
        </GroupListHeader>

        <AllTasksButton
          $isActive={selectedGroupId === null}
          onClick={() => onSelectGroup(null)}
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
