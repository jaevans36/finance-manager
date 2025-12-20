import React from 'react';
import styled from 'styled-components';
import { Task } from '../../services/taskService';
import { Card, Button, Text, TextSmall, Badge, Flex } from '../ui';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskCard = styled(Card)<{ $completed: boolean }>`
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  opacity: ${({ $completed }) => ($completed ? 0.6 : 1)};

  @media (max-width: 768px) {
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

  @media (max-width: 768px) {
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

export const TaskItem = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskItemProps) => {
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
    <TaskCard $completed={task.completed} role="article" aria-label={`Task: ${task.title}`}>
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
                borderColor: task.groupColour || '#6B7280',
                color: task.groupColour || '#6B7280'
              }}
            >
              {task.groupName}
            </Badge>
          )}
          <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
          {isOverdue && <Badge variant="error">OVERDUE</Badge>}
        </Flex>

        {task.description && (
          <TaskDescription>{task.description}</TaskDescription>
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

      <Flex gap={5}>
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
};
