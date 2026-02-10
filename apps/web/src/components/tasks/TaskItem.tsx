import { memo, useState, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import { ChevronDown } from 'lucide-react';
import { spacing, borderRadius, mediaQueries } from '@finance-manager/ui/styles';
import { Task } from '../../services/taskService';
import { Card, Button, Text, TextSmall, Badge, Flex } from '../ui';
import { SubtaskProgress } from './SubtaskProgress';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  /** Whether the subtask list below this item is expanded */
  isSubtaskExpanded?: boolean;
  /** Toggle the subtask expansion for this task */
  onToggleSubtaskExpand?: (taskId: string) => void;
}

const TaskCard = styled(Card)<{ $completed: boolean; $contained: boolean }>`
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  opacity: ${({ $completed }) => ($completed ? 0.6 : 1)};

  ${({ $contained }) =>
    $contained
      ? `
    border: none;
    border-radius: 0;
    margin-bottom: 0;
  `
      : `
    margin-bottom: 10px;
  `}

  ${mediaQueries.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;

  ${mediaQueries.tablet} {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
`;

const TaskTitle = styled.h3<{ $completed: boolean }>`
  margin: 0;
  font-size: 16px;
  text-decoration: ${({ $completed }) => ($completed ? 'line-through' : 'none')};
  color: ${({ theme }) => theme.colors.text};
`;

const TaskDescription = styled(Text)`
  margin: 5px 0;
`;

const getPriorityVariant = (priority: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (priority) {
    case 'Critical':
      return 'error';
    case 'High':
      return 'error';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'success';
    default:
      return 'info';
  }
};

const ExpandChevron = styled.button<{ $expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: ${spacing.xs};
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color 200ms ease, transform 200ms ease;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
    transition: transform 200ms ease;
    transform: ${({ $expanded }) => ($expanded ? 'rotate(0deg)' : 'rotate(-90deg)')};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  }
`;

const SubtaskCountBadge = styled(Badge)`
  font-size: 10px;
  padding: 2px 6px;
`;

const SubtaskProgressInline = styled.div`
  margin-top: ${spacing.xs};
  max-width: 240px;
`;

export const TaskItem = memo(({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isSubtaskExpanded = false,
  onToggleSubtaskExpand,
}: TaskItemProps) => {
  const theme = useTheme();
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const wasModified = new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime() + 1000;

  return (
    <TaskCard $completed={task.completed} $contained={isSubtaskExpanded} role="article" aria-label={`Task: ${task.title}`}>
      <Checkbox
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task.id)}
        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      <div style={{ flex: 1 }}>
        <Flex align="center" gap={10} style={{ marginBottom: '5px' }}>
          <TaskTitle $completed={task.completed}>{task.title}</TaskTitle>
          {task.groupName && (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: task.groupColour || theme.colors.textSecondary,
                color: task.groupColour || theme.colors.textSecondary
              }}
            >
              {task.groupName}
            </Badge>
          )}
          <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
          {isOverdue && <Badge variant="error">OVERDUE</Badge>}
          {task.hasSubtasks && (
            <SubtaskCountBadge variant="info">
              {task.completedSubtaskCount}/{task.subtaskCount} ✓
            </SubtaskCountBadge>
          )}
        </Flex>

        {task.description && (
          <TaskDescription>{task.description}</TaskDescription>
        )}

        {/* Inline subtask progress bar */}
        {task.hasSubtasks && (
          <SubtaskProgressInline>
            <SubtaskProgress
              completed={task.completedSubtaskCount}
              total={task.subtaskCount}
              percentage={task.progressPercentage}
              compact
            />
          </SubtaskProgressInline>
        )}

        <TextSmall style={{ marginTop: '5px' }}>
          {task.dueDate && (
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          )}
          {task.completedAt && (
            <span style={{ marginLeft: '15px' }}>
              Completed: {new Date(task.completedAt).toLocaleDateString()}
            </span>
          )}
          <span style={{ marginLeft: task.dueDate || task.completedAt ? '15px' : '0' }}>
            Created: {formatDateTime(task.createdAt)}
          </span>
          {wasModified && (
            <span style={{ marginLeft: '15px' }}>
              Modified: {formatDateTime(task.updatedAt)}
            </span>
          )}
        </TextSmall>
      </div>

      <Flex gap={5} align="center">
        {onToggleSubtaskExpand && (
          <ExpandChevron
            $expanded={isSubtaskExpanded}
            onClick={() => onToggleSubtaskExpand(task.id)}
            aria-label={isSubtaskExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
            aria-expanded={isSubtaskExpanded}
            title={task.hasSubtasks ? `${task.subtaskCount} subtask${task.subtaskCount !== 1 ? 's' : ''}` : 'Add subtasks'}
          >
            <ChevronDown />
          </ExpandChevron>
        )}
        <Button 
          variant="primary" 
          size="small" 
          onClick={() => onEdit(task)}
          aria-label={`Edit task "${task.title}"`}
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="small" 
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task "${task.title}"`}
        >
          Delete
        </Button>
      </Flex>
    </TaskCard>
  );
});

TaskItem.displayName = 'TaskItem';
