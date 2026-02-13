import styled, { useTheme } from 'styled-components';
import { Card, Text } from '../ui';
import { CheckCircleIcon, CircleIcon, AlertCircleIcon, FolderIcon } from 'lucide-react';
import { borderRadius, mediaQueries } from '../../styles/layout';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  ${mediaQueries.tablet} {
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
    box-shadow: none;
  }

  ${mediaQueries.tablet} {
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
  border-radius: ${borderRadius.lg};
  background-color: ${({ $color }) => $color}15;
  color: ${({ $color }) => $color};
  flex-shrink: 0;

  svg {
    pointer-events: none;
  }

  ${mediaQueries.tablet} {
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
    $isPositive ? theme.colors.successText : theme.colors.textSecondary};
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

export const TaskStatistics = ({ tasks, totalGroups }: TaskStatisticsProps) => {
  const theme = useTheme();
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
      <StatCard $color={theme.colors.info} aria-label={`Total tasks: ${totalTasks}`}>
        <StatIcon $color={theme.colors.info} aria-hidden="true">
          <CircleIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>{totalTasks}</StatValue>
          <StatLabel>Total Tasks</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard $color={theme.colors.success} aria-label={`Completed tasks: ${completedTasks} of ${totalTasks}, ${completionRate}%`}>
        <StatIcon $color={theme.colors.success} aria-hidden="true">
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

      <StatCard $color={theme.colors.warning} aria-label={`Overdue tasks: ${overdueTasks}`}>
        <StatIcon $color={theme.colors.warning} aria-hidden="true">
          <AlertCircleIcon size={24} />
        </StatIcon>
        <StatContent>
          <StatValue>{overdueTasks}</StatValue>
          <StatLabel>Overdue Tasks</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard $color={theme.colors.primary} aria-label={`Task groups: ${totalGroups}`}>
        <StatIcon $color={theme.colors.primary} aria-hidden="true">
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
