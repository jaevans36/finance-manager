import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { TaskItem } from '../../src/components/tasks/TaskItem';
import { Task } from '../../src/services/taskService';

describe('TaskItem', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'Medium',
    completed: false,
    dueDate: '2025-12-31',
    userId: 'user1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    completedAt: null,
  };

  const mockHandlers = {
    onToggleComplete: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render task title and description', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render priority badge', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const priorityBadge = screen.getByText('Medium');
      expect(priorityBadge).toBeInTheDocument();
    });

    it('should render due date when present', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      // Accept either DD/MM/YYYY or MM/DD/YYYY format (locale-dependent)
      expect(screen.getByText(/Due: (31\/12\/2025|12\/31\/2025)/)).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const taskWithoutDescription = { ...mockTask, description: null };
      render(<TaskItem task={taskWithoutDescription} {...mockHandlers} />);

      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('should show OVERDUE badge for past due dates on incomplete tasks', () => {
      const overdueTask = { ...mockTask, dueDate: '2020-01-01' };
      render(<TaskItem task={overdueTask} {...mockHandlers} />);

      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });

    it('should not show OVERDUE badge for completed tasks', () => {
      const completedOverdueTask = {
        ...mockTask,
        dueDate: '2020-01-01',
        completed: true,
      };
      render(<TaskItem task={completedOverdueTask} {...mockHandlers} />);

      expect(screen.queryByText('OVERDUE')).not.toBeInTheDocument();
    });

    it('should show completed date when task is completed', () => {
      const completedTask = {
        ...mockTask,
        completed: true,
        completedAt: '2025-11-15',
      };
      render(<TaskItem task={completedTask} {...mockHandlers} />);

      // Accept either DD/MM/YYYY or MM/DD/YYYY format (locale-dependent)
      expect(screen.getByText(/Completed: (15\/11\/2025|11\/15\/2025)/)).toBeInTheDocument();
    });
  });

  describe('Checkbox Interaction', () => {
    it('should render checkbox unchecked for incomplete tasks', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should render checkbox checked for completed tasks', () => {
      const completedTask = { ...mockTask, completed: true };
      render(<TaskItem task={completedTask} {...mockHandlers} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call onToggleComplete when checkbox is clicked', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockHandlers.onToggleComplete).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith('1');
    });

    it('should apply strikethrough style to completed tasks', () => {
      const completedTask = { ...mockTask, completed: true };
      render(<TaskItem task={completedTask} {...mockHandlers} />);

      const title = screen.getByText('Test Task');
      expect(title).toHaveClass('line-through');
    });
  });

  describe('Button Interactions', () => {
    it('should render Edit and Delete buttons', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onEdit with task when Edit button is clicked', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTask);
    });

    it('should call onDelete with task id when Delete button is clicked', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Priority Badges', () => {
    it('should display High priority badge', () => {
      const highPriorityTask: Task = { ...mockTask, priority: 'High' };
      render(<TaskItem task={highPriorityTask} {...mockHandlers} />);

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should display Medium priority badge', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should display Low priority badge', () => {
      const lowPriorityTask: Task = { ...mockTask, priority: 'Low' };
      render(<TaskItem task={lowPriorityTask} {...mockHandlers} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });
});
