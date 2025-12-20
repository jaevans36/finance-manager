import React from 'react';
import styled from 'styled-components';
import { Card, Text } from '../ui';
import { CheckCircleIcon, CircleIcon, AlertCircleIcon, FolderIcon } from 'lucide-react';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
`;

const StatCard = styled(Card)<{ $color?: string }>`
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 4px solid ${({ $color, theme }) => $color || theme.colors.primary};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  }

  @media (max-width: 768px) {
    padding: 14px;
    gap: 12px;
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${({ $color }) => $color}15;
  color: ${({ $color }) => $color};
  flex-shrink: 0;

  svg {
    pointer-events: none;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.2;
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  margin-top: 4px;
  opacity: 0.8;
`;

const StatPercentage = styled.span<{ $isPositive?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
  color: ${({ $isPositive, theme }) => 
    $isPositive ? theme.colors.success : theme.colors.textSecondary};
`;

interface Task {
  id: string;
  completed: boolean;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  groupId: string | null;
}

interface TaskStatisticsProps {
  tasks: Task[];
  totalGroups: number;
}

export const TaskStatistics: React.FC<TaskStatisticsProps> = ({ tasks, totalGroups }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  
  const overdueTasks = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  return (
    <StatsGrid role="region" aria-label="Task statistics">
      <StatCard $color="#3B82F6" aria-label={`Total tasks: ${totalTasks}`}>
        <StatIcon $color="#3B82F6" aria-hidden="true">
          <CircleIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>{totalTasks}</StatValue>
          <StatLabel>Total Tasks</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard $color="#10B981" aria-label={`Completed tasks: ${completedTasks} of ${totalTasks}, ${completionRate}%`}>
        <StatIcon $color="#10B981" aria-hidden="true">
          <CheckCircleIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>
            {completedTasks}
            <StatPercentage $isPositive={completionRate >= 50}>
              {completionRate}%
            </StatPercentage>
          </StatValue>
          <StatLabel>Completed</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard $color="#F59E0B" aria-label={`Overdue tasks: ${overdueTasks}`}>
        <StatIcon $color="#F59E0B" aria-hidden="true">
          <AlertCircleIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>{overdueTasks}</StatValue>
          <StatLabel>Overdue Tasks</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard $color="#8B5CF6" aria-label={`Task groups: ${totalGroups}`}>
        <StatIcon $color="#8B5CF6" aria-hidden="true">
          <FolderIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>{totalGroups}</StatValue>
          <StatLabel>Task Groups</StatLabel>
        </StatContent>
      </StatCard>
    </StatsGrid>
  );
};
