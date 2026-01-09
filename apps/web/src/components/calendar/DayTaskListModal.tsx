import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Check, Circle } from 'lucide-react';
import type { CalendarTask } from '../../types/calendar';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 20px;
    max-height: 90vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DateDisplay = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskItem = styled.div<{ $isCompleted: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${({ $isCompleted }) => ($isCompleted ? 0.6 : 1)};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const TaskCheckbox = styled.button<{ $isCompleted: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  background: ${({ $isCompleted, theme }) =>
    $isCompleted ? theme.colors.success : 'transparent'};
  border: 2px solid
    ${({ $isCompleted, theme }) =>
      $isCompleted ? theme.colors.success : theme.colors.border};
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    border-color: ${({ theme }) => theme.colors.success};
    background: ${({ $isCompleted, theme }) =>
      $isCompleted ? theme.colors.success : `${theme.colors.success}20`};
  }

  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskTitle = styled.h3<{ $isCompleted: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px 0;
  text-decoration: ${({ $isCompleted }) => ($isCompleted ? 'line-through' : 'none')};
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PriorityBadge = styled.span<{ $priority: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $priority, theme }) => {
    switch ($priority) {
      case 'Critical':
        return theme.colors.error;
      case 'High':
        return theme.colors.warning;
      case 'Medium':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  }};
  color: white;
`;

const GroupBadge = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $color }) => $color || '#cccccc'};
  color: white;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

interface DayTaskListModalProps {
  date: Date;
  tasks: CalendarTask[];
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onTaskClick: (task: CalendarTask) => void;
  onCancel: () => void;
}

export const DayTaskListModal = ({ 
  date, 
  tasks, 
  onToggleTask, 
  onTaskClick, 
  onCancel 
}: DayTaskListModalProps) => {
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setTogglingTasks((prev) => new Set(prev).add(taskId));
    try {
      await onToggleTask(taskId, !currentCompleted);
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ModalOverlay onClick={onCancel} role="dialog" aria-modal="true">
      <ModalContent onClick={handleModalClick}>
        <ModalHeader>
          <ModalTitle>Tasks for {formatDate(date)}</ModalTitle>
          <CloseButton onClick={onCancel} aria-label="Close modal">
            <X />
          </CloseButton>
        </ModalHeader>

        <DateDisplay>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </DateDisplay>

        {tasks.length === 0 ? (
          <EmptyState>
            <Circle />
            <p>No tasks scheduled for this date</p>
          </EmptyState>
        ) : (
          <TaskList>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                $isCompleted={task.isCompleted}
                onClick={() => onTaskClick(task)}
              >
                <TaskCheckbox
                  $isCompleted={task.isCompleted}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(task.id, task.isCompleted);
                  }}
                  disabled={togglingTasks.has(task.id)}
                  aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.isCompleted && <Check />}
                </TaskCheckbox>

                <TaskContent>
                  <TaskTitle $isCompleted={task.isCompleted}>{task.title}</TaskTitle>
                  <TaskMeta>
                    <PriorityBadge $priority={task.priority}>{task.priority}</PriorityBadge>
                    {task.groupName && (
                      <GroupBadge $color={task.groupColor}>{task.groupName}</GroupBadge>
                    )}
                  </TaskMeta>
                </TaskContent>
              </TaskItem>
            ))}
          </TaskList>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};
