import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../../src/components/tasks/TaskItem';
import { Task } from '../../src/services/taskService';

describe('TaskItem', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'MEDIUM',
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

    it('should render priority badge with correct color', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const priorityBadge = screen.getByText('MEDIUM');
      expect(priorityBadge).toBeInTheDocument();
      expect(priorityBadge).toHaveStyle({ backgroundColor: '#ffc107' });
    });

    it('should render due date when present', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      expect(screen.getByText(/Due: 31\/12\/2025/)).toBeInTheDocument(); // DD/MM/YYYY format
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

      expect(screen.getByText(/Completed: 15\/11\/2025/)).toBeInTheDocument(); // DD/MM/YYYY format
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
      expect(title).toHaveStyle({ textDecoration: 'line-through' });
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

  describe('Priority Colors', () => {
    it('should display HIGH priority with red color', () => {
      const highPriorityTask: Task = { ...mockTask, priority: 'HIGH' };
      render(<TaskItem task={highPriorityTask} {...mockHandlers} />);

      const priorityBadge = screen.getByText('HIGH');
      expect(priorityBadge).toHaveStyle({ backgroundColor: '#dc3545' });
    });

    it('should display MEDIUM priority with yellow color', () => {
      render(<TaskItem task={mockTask} {...mockHandlers} />);

      const priorityBadge = screen.getByText('MEDIUM');
      expect(priorityBadge).toHaveStyle({ backgroundColor: '#ffc107' });
    });

    it('should display LOW priority with green color', () => {
      const lowPriorityTask: Task = { ...mockTask, priority: 'LOW' };
      render(<TaskItem task={lowPriorityTask} {...mockHandlers} />);

      const priorityBadge = screen.getByText('LOW');
      expect(priorityBadge).toHaveStyle({ backgroundColor: '#28a745' });
    });
  });
});
