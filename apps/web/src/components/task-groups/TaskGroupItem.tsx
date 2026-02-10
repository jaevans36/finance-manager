import styled from 'styled-components';
import { borderRadius } from '@finance-manager/ui/styles';
import { TaskGroup } from '../../types/taskGroup';
import { Text, Badge } from '../ui';
import { FolderIcon } from 'lucide-react';

const GroupItemContainer = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: ${borderRadius.lg};
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.backgroundSecondary : 'transparent'};

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`;

const ColourIndicator = styled.div<{ $colour: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ $colour }) => $colour};
  flex-shrink: 0;
`;

const GroupInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const GroupName = styled(Text)`
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface TaskGroupItemProps {
  group: TaskGroup;
  isActive: boolean;
  onClick: () => void;
}

export const TaskGroupItem = ({ group, isActive, onClick }: TaskGroupItemProps) => {
  return (
    <GroupItemContainer 
      $isActive={isActive} 
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
      <ColourIndicator $colour={group.colour} aria-hidden="true" />
      <FolderIcon size={18} aria-hidden="true" />
      <GroupInfo>
        <GroupName>{group.name}</GroupName>
      </GroupInfo>
      <Badge variant="outline" aria-label={`${group.taskCount} tasks`}>{group.taskCount}</Badge>
    </GroupItemContainer>
  );
};
