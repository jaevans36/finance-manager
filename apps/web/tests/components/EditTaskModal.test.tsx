import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditTaskModal } from '../../src/components/tasks/EditTaskModal';

describe('EditTaskModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const mockTask = {
    id: 'task-1',
    title: 'Original Task',
    description: 'Original description',
    priority: 'MEDIUM' as const,
    dueDate: '2024-12-31',
    completed: false,
    completedAt: null,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with Edit Task heading', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    it('should pre-populate form with task data', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
      const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;

      expect(titleInput.value).toBe('Original Task');
      expect(descriptionTextarea.value).toBe('Original description');
      expect(prioritySelect.value).toBe('MEDIUM');
      expect(dueDateInput.value).toBe('2024-12-31');
    });

    it('should handle null description', () => {
      const taskWithoutDescription = { ...mockTask, description: null };
      render(<EditTaskModal task={taskWithoutDescription} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionTextarea.value).toBe('');
    });

    it('should handle null due date', () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: null };
      render(<EditTaskModal task={taskWithoutDueDate} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;
      expect(dueDateInput.value).toBe('');
    });

    it('should render Save Changes and Cancel buttons', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show character count for title', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('13/200')).toBeInTheDocument(); // "Original Task" is 13 characters
    });
  });

  describe('Form Input', () => {
    it('should update title value when editing', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      expect(titleInput.value).toBe('Updated Task');
      expect(screen.getByText('12/200')).toBeInTheDocument();
    });

    it('should update description value when editing', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });

      expect(descriptionTextarea.value).toBe('Updated description');
    });

    it('should update priority when selecting different option', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
      fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });

      expect(prioritySelect.value).toBe('HIGH');
    });

    it('should update due date when changing date', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;
      fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

      expect(dueDateInput.value).toBe('2025-01-15');
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting with empty title', async () => {
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when submitting with whitespace-only title', async () => {
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not show error when valid title is provided', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with task id and updated data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'Updated Task',
          description: 'Original description',
          priority: 'MEDIUM',
          dueDate: '2024-12-31',
        });
      });
    });

    it('should call onSubmit with all updated fields', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Title' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New Description' } });
      fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'LOW' } });
      fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2025-06-15' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'New Title',
          description: 'New Description',
          priority: 'LOW',
          dueDate: '2025-06-15',
        });
      });
    });

    it('should trim whitespace from title and description', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  Trimmed  ' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Desc  ' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'Trimmed',
          description: 'Desc',
          priority: 'MEDIUM',
          dueDate: '2024-12-31',
        });
      });
    });

    it('should send undefined for empty description', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', expect.objectContaining({
          description: undefined,
        }));
      });
    });

    it('should send undefined for empty due date', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '' } });

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', expect.objectContaining({
          dueDate: undefined,
        }));
      });
    });

    it('should disable form inputs while submitting', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/priority/i)).toBeDisabled();
      expect(screen.getByLabelText(/due date/i)).toBeDisabled();

      resolveSubmit!();
    });

    it('should show error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Update failed'));
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('should show generic error for non-Error rejection', async () => {
      mockOnSubmit.mockRejectedValue('Unknown error');
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Failed to update task')).toBeInTheDocument();
      });
    });

    it('should clear error when submitting again', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('First error'));
      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      mockOnSubmit.mockResolvedValueOnce(undefined);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking backdrop', () => {
      const { container } = render(
        <EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking inside modal content', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const modalContent = screen.getByText('Edit Task').closest('div');
      fireEvent.click(modalContent!);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when pressing Escape key', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel for other keys', () => {
      render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Tab' });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should disable cancel button while submitting', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      const { container } = render(<EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const form = container.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });

      resolveSubmit!();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(
        <EditTaskModal task={mockTask} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
