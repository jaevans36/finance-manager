import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { TaskList } from '../../src/components/tasks/TaskList';
import { Task } from '../../src/services/taskService';

// Mock TaskItem component to simplify testing
jest.mock('../../src/components/tasks/TaskItem', () => ({
  TaskItem: ({ task }: { task: Task }) => <div data-testid={`task-${task.id}`}>{task.title}</div>,
}));

describe('TaskList', () => {
  const mockOnToggleComplete = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'First Task',
      description: 'First description',
      priority: 'HIGH',
      completed: false,
      completedAt: null,
      dueDate: null,
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Second Task',
      description: 'Second description',
      priority: 'MEDIUM',
      completed: true,
      completedAt: '2024-01-02T12:00:00Z',
      dueDate: null,
      userId: 'user-1',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      title: 'Third Task',
      description: null,
      priority: 'LOW',
      completed: false,
      completedAt: null,
      dueDate: null,
      userId: 'user-1',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading message when isLoading is true', () => {
      render(
        <TaskList
          tasks={[]}
          isLoading={true}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('should not display tasks when loading', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={true}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('task-3')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no tasks and not loading', () => {
      render(
        <TaskList
          tasks={[]}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first task to get started!')).toBeInTheDocument();
    });

    it('should not show loading message in empty state', () => {
      render(
        <TaskList
          tasks={[]}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
  });

  describe('Task Rendering', () => {
    it('should render all tasks when provided', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-3')).toBeInTheDocument();
    });

    it('should render tasks with correct titles', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.getByText('Third Task')).toBeInTheDocument();
    });

    it('should render single task correctly', () => {
      const singleTask = [mockTasks[0]];
      render(
        <TaskList
          tasks={singleTask}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('task-1')).toBeInTheDocument();
      expect(screen.queryByTestId('task-2')).not.toBeInTheDocument();
      expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument();
    });

    it('should not show empty state when tasks are present', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument();
      expect(screen.queryByText('Create your first task to get started!')).not.toBeInTheDocument();
    });

    it('should not show loading state when tasks are present', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
  });

  describe('Task Ordering', () => {
    it('should render tasks in the order provided', () => {
      render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const taskElements = screen.getAllByTestId(/task-/);
      expect(taskElements).toHaveLength(3);
      expect(taskElements[0]).toHaveAttribute('data-testid', 'task-1');
      expect(taskElements[1]).toHaveAttribute('data-testid', 'task-2');
      expect(taskElements[2]).toHaveAttribute('data-testid', 'task-3');
    });

    it('should maintain order when tasks array changes', () => {
      const { rerender } = render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reversedTasks = [...mockTasks].reverse();
      rerender(
        <TaskList
          tasks={reversedTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const taskElements = screen.getAllByTestId(/task-/);
      expect(taskElements[0]).toHaveAttribute('data-testid', 'task-3');
      expect(taskElements[1]).toHaveAttribute('data-testid', 'task-2');
      expect(taskElements[2]).toHaveAttribute('data-testid', 'task-1');
    });
  });

  describe('Props Passing', () => {
    it('should pass all required props to TaskItem components', () => {
      const { container } = render(
        <TaskList
          tasks={mockTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // TaskItem is mocked, so we verify it was rendered with correct count
      const taskItems = container.querySelectorAll('[data-testid^="task-"]');
      expect(taskItems).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks with missing optional fields', () => {
      const minimalTask: Task = {
        id: '99',
        title: 'Minimal Task',
        description: null,
        priority: 'MEDIUM',
        dueDate: null,
        completed: false,
        completedAt: null,
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      render(
        <TaskList
          tasks={[minimalTask]}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    });

    it('should handle very long task list', () => {
      const manyTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: null,
        priority: 'MEDIUM' as const,
        dueDate: null,
        completed: false,
        completedAt: null,
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }));

      render(
        <TaskList
          tasks={manyTasks}
          isLoading={false}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const taskElements = screen.getAllByTestId(/task-/);
      expect(taskElements).toHaveLength(100);
    });
  });
});
