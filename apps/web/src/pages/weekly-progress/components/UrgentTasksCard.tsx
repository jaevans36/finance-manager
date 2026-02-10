import styled from 'styled-components';
import { Card, SmallBadge, TextSmall, ScrollableContainer } from '@finance-manager/ui';
import { borderRadius } from '@finance-manager/ui/styles';
import type { Task } from '../../../services/taskService';
import { chartColors } from '../../../components/charts/chartTheme';

const TaskItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: ${({ theme, $completed }) => 
    $completed ? theme.colors.backgroundSecondary : theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
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
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const TaskDueDate = styled(TextSmall)<{ $overdue: boolean }>`
  padding: 2px 6px;
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme, $overdue }) => $overdue ? theme.colors.errorBackground : 'transparent'};
  color: ${({ theme, $overdue }) => $overdue ? chartColors.critical : theme.colors.textSecondary};
  font-weight: ${({ $overdue }) => $overdue ? '600' : '400'};
`;

const EmptyState = styled(TextSmall)`
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

interface UrgentTasksCardProps {
  tasks: Task[];
  title: string;
  emptyMessage?: string;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export const UrgentTasksCard = ({
  tasks,
  title,
  emptyMessage = 'No tasks',
  onToggleTask,
}: UrgentTasksCardProps) => {
  return (
    <Card style={{ padding: '18px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
      
      {tasks.length > 0 ? (
        <ScrollableContainer style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => {
            const isDueToday = task.dueDate && 
              new Date(task.dueDate).toDateString() === new Date().toDateString();
            const isOverdue = task.dueDate && 
              new Date(task.dueDate) < new Date() && 
              new Date(task.dueDate).toDateString() !== new Date().toDateString();
            
            return (
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
                    {task.dueDate && (
                      <TaskDueDate $overdue={!!isOverdue}>
                        {isOverdue ? '⚠ Overdue' : isDueToday ? 'Due today' : 'Upcoming'}
                      </TaskDueDate>
                    )}
                  </TaskMeta>
                </TaskContent>
              </TaskItem>
            );
          })}
        </ScrollableContainer>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </Card>
  );
};
