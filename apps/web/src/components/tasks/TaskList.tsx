import styled from 'styled-components';
import { Task } from '../../services/taskService';
import { TaskItem } from './TaskItem';
import { Card, Text, TextSecondary } from '../ui';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const EmptyState = styled(Card)`
  text-align: center;
  padding: 60px 20px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const TaskList = ({
  tasks,
  isLoading,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskListProps) => {
  if (isLoading) {
    return <LoadingState role="status" aria-live="polite">Loading tasks...</LoadingState>;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState role="status">
        <Text style={{ marginBottom: '10px' }}>No tasks yet</Text>
        <TextSecondary>Create your first task to get started!</TextSecondary>
      </EmptyState>
    );
  }

  return (
    <div role="list" aria-label={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
