import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTaskForm } from '../../src/components/tasks/CreateTaskForm';

describe('CreateTaskForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all fields', () => {
      render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have MEDIUM as default priority', () => {
      render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
      expect(prioritySelect.value).toBe('MEDIUM');
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting without title', async () => {
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when submitting with only whitespace title', async () => {
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with title only', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Task',
          description: undefined,
          priority: 'MEDIUM',
          dueDate: undefined,
        });
      });
    });

    it('should call onSubmit with all fields filled', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Complete Task' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Task details' } });
      fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'HIGH' } });
      fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2024-12-31' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Complete Task',
          description: 'Task details',
          priority: 'HIGH',
          dueDate: '2024-12-31',
        });
      });
    });

    it('should trim whitespace from title and description', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  Trimmed Title  ' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Trimmed Desc  ' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Trimmed Title',
          description: 'Trimmed Desc',
          priority: 'MEDIUM',
          dueDate: undefined,
        });
      });
    });

    it('should reset form after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
      const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'Test Description' } });
      fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });
      fireEvent.change(dueDateInput, { target: { value: '2024-12-31' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
        expect(descriptionTextarea.value).toBe('');
        expect(prioritySelect.value).toBe('MEDIUM');
        expect(dueDateInput.value).toBe('');
      });
    });

    it('should show error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      const { container } = render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
