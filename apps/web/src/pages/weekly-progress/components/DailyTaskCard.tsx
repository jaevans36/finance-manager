import styled from 'styled-components';
import { Card, SmallBadge, TextSmall, ScrollableContainer } from '../../../components/ui';
import type { Task } from '../../../services/taskService';
import { chartColors } from '../../../components/charts/chartTheme';

const DayCard = styled(Card)`
  padding: 18px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-in;

  &:hover {
    transform: translateY(-3px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 10px;
  margin-bottom: 12px;
`;

const DayHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const DayName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
`;

const DayDate = styled(TextSmall)`
  display: block;
  margin-top: 2px;
`;

const TaskCount = styled(TextSmall)`
  font-weight: 500;
`;

const DayProgressContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 16px;
`;

const DayProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 6px;
  overflow: visible;
  position: relative;
`;

const DayProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, ${chartColors.primary} 0%, #45a049 100%);
  transition: width 0.5s ease;
  border-radius: ${({ $percentage }) => $percentage === 100 ? '6px' : '6px 0 0 6px'};
`;

const ProgressHeader = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  margin-bottom: 4px;
`;

const ProgressPercentage = styled.div<{ $percentage: number }>`
  position: absolute;
  left: ${({ $percentage }) => $percentage}%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: left 0.5s ease;
`;

const PercentageValue = styled.span<{ $percentage: number }>`
  font-size: 14px;
  font-weight: 700;
  color: ${chartColors.primary};
  position: relative;
  left: ${({ $percentage }) => {
    if ($percentage <= 2) return '24px';
    if ($percentage >= 98) return '-16px';
    return '0';
  }};
`;

const ProgressArrow = styled.div`
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid ${chartColors.primary};
`;

const TaskItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: ${({ theme, $completed }) => 
    $completed ? theme.colors.backgroundSecondary : theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateX(2px);
  }
`;

const TaskCheckbox = styled.input`
  margin-top: 2px;
  cursor: pointer;
`;

const TaskContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskTitle = styled.div<{ $completed: boolean }>`
  font-weight: 500;
  color: ${({ theme, $completed }) => $completed ? theme.colors.textSecondary : theme.colors.text};
  text-decoration: ${({ $completed }) => $completed ? 'line-through' : 'none'};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const TaskGroup = styled(TextSmall)`
  padding: 2px 6px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const EmptyDay = styled(TextSmall)`
  display: block;
  text-align: center;
  padding: 20px;
`;

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Critical': return chartColors.critical;
    case 'High': return chartColors.high;
    case 'Medium': return chartColors.medium;
    default: return chartColors.low;
  }
};

const removeDayPrefix = (title: string): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of days) {
    if (title.endsWith(` - ${day}`)) {
      return title.substring(0, title.length - day.length - 3);
    }
  }
  return title;
};

interface DailyTaskCardProps {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasks: Task[];
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
  date,
  totalTasks,
  completedTasks,
  completionRate,
  tasks,
  onToggleTask,
}) => {
  const dayDate = new Date(date);
  const dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayNumber = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  return (
    <DayCard>
      <DayHeader>
        <DayHeaderLeft>
          <DayName>{dayName}</DayName>
          <DayDate>{dayNumber}</DayDate>
        </DayHeaderLeft>
        <TaskCount>
          {completedTasks}/{totalTasks} tasks
        </TaskCount>
      </DayHeader>
      
      {totalTasks > 0 && (
        <DayProgressContainer>
          <ProgressHeader>
            <ProgressPercentage $percentage={completionRate}>
              <PercentageValue $percentage={completionRate}>
                {completionRate.toFixed(0)}%
              </PercentageValue>
              <ProgressArrow />
            </ProgressPercentage>
          </ProgressHeader>
          <DayProgressBar>
            <DayProgressFill $percentage={completionRate} />
          </DayProgressBar>
        </DayProgressContainer>
      )}
      
      {tasks.length > 0 ? (
        <ScrollableContainer 
          style={{ 
            marginTop: '12px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            flex: 1 
          }}
        >
          {tasks.map((task) => (
            <TaskItem key={task.id} $completed={task.completed}>
              <TaskCheckbox 
                type="checkbox" 
                checked={task.completed}
                onChange={() => onToggleTask(task.id, task.completed)}
              />
              <TaskContent>
                <TaskTitle $completed={task.completed} title={task.title}>
                  {removeDayPrefix(task.title)}
                </TaskTitle>
                <TaskMeta>
                  <SmallBadge style={{ backgroundColor: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </SmallBadge>
                  {task.groupName && (
                    <TaskGroup>{task.groupName}</TaskGroup>
                  )}
                </TaskMeta>
              </TaskContent>
            </TaskItem>
          ))}
        </ScrollableContainer>
      ) : (
        <EmptyDay>No tasks</EmptyDay>
      )}
    </DayCard>
  );
};
