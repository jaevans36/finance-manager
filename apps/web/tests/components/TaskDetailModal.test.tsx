import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../src/styles/theme';
import { EditTaskModal } from '../../src/components/tasks/TaskDetailModal';

// Mock the useSubtasks hook
jest.mock('../../src/hooks/useSubtasks', () => ({
  useSubtasks: () => ({
    subtasks: [],
    isLoading: false,
    error: null,
    fetchSubtasks: jest.fn(),
    createSubtask: jest.fn(),
    bulkCreateSubtasks: jest.fn(),
    toggleSubtask: jest.fn(),
    renameSubtask: jest.fn(),
    deleteSubtask: jest.fn(),
    reorderSubtasks: jest.fn(),
    bulkComplete: jest.fn(),
    selectedIds: new Set<string>(),
    toggleSelected: jest.fn(),
    selectAll: jest.fn(),
    deselectAll: jest.fn(),
  }),
}));

describe('TaskDetailModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleComplete = jest.fn();

  const mockTask = {
    id: 'task-1',
    title: 'Original Task',
    description: 'Original description',
    priority: 'Medium' as const,
    dueDate: '2024-12-31',
    completed: false,
    completedAt: null,
    userId: 'user-1',
    groupId: null,
    groupName: null,
    groupColour: null,
    parentTaskId: null,
    hasSubtasks: false,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    progressPercentage: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Render with ThemeProvider */
  const renderModal = (
    props: Partial<React.ComponentProps<typeof EditTaskModal>> = {},
  ) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <EditTaskModal
          task={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          {...props}
        />
      </ThemeProvider>,
    );
  };

  /** Click the Edit button to enter edit mode */
  const enterEditMode = () => {
    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));
  };

  // ════════════════════════════════════════════════════════════════════════
  // View Mode (default)
  // ════════════════════════════════════════════════════════════════════════

  describe('View Mode (default)', () => {
    it('should render the task title as a heading', () => {
      renderModal();
      expect(screen.getByRole('heading', { name: 'Original Task' })).toBeInTheDocument();
    });

    it('should display the task status', () => {
      renderModal();
      expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1);
    });

    it('should display the task priority', () => {
      renderModal();
      expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1);
    });

    it('should display formatted due date', () => {
      renderModal();
      expect(screen.getByText('31 Dec 2024')).toBeInTheDocument();
    });

    it('should show "No due date" when dueDate is null', () => {
      renderModal({ task: { ...mockTask, dueDate: null } });
      expect(screen.getByText('No due date')).toBeInTheDocument();
    });

    it('should show "No description" when description is null', () => {
      renderModal({ task: { ...mockTask, description: null } });
      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('should display the description text', () => {
      renderModal();
      expect(screen.getByText('Original description')).toBeInTheDocument();
    });

    it('should render tab bar with Subtasks, Comments, and Linked Items', () => {
      renderModal();
      expect(screen.getByRole('tab', { name: /subtasks/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /comments/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /linked items/i })).toBeInTheDocument();
    });

    it('should show Subtasks tab as active by default', () => {
      renderModal();
      expect(screen.getByRole('tab', { name: /subtasks/i })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('should show stub text for Comments tab', () => {
      renderModal();
      fireEvent.click(screen.getByRole('tab', { name: /comments/i }));
      expect(screen.getByText('Comments coming soon')).toBeInTheDocument();
    });

    it('should show stub text for Linked Items tab', () => {
      renderModal();
      fireEvent.click(screen.getByRole('tab', { name: /linked items/i }));
      expect(screen.getByText('Linked items coming soon')).toBeInTheDocument();
    });

    it('should render edit button', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /edit task/i })).toBeInTheDocument();
    });

    it('should render overflow menu with delete when onDelete is provided', () => {
      renderModal({ onDelete: mockOnDelete });
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      expect(screen.getByText('Delete task')).toBeInTheDocument();
    });

    it('should not render overflow button when onDelete is not provided', () => {
      renderModal();
      expect(
        screen.queryByRole('button', { name: /more actions/i }),
      ).not.toBeInTheDocument();
    });

    it('should display group badge when task has a group', () => {
      renderModal({
        task: { ...mockTask, groupName: 'Work', groupColour: '#FF0000' },
      });
      expect(screen.getAllByText('Work').length).toBeGreaterThanOrEqual(1);
    });

    it('should show completed status for completed task', () => {
      renderModal({ task: { ...mockTask, completed: true } });
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    });

    it('should show attachments section with empty state', () => {
      renderModal();
      expect(screen.getByText('No attachments')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Edit Mode
  // ════════════════════════════════════════════════════════════════════════

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit button is clicked', () => {
      renderModal();
      enterEditMode();
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    });

    it('should pre-populate form with task data', () => {
      renderModal();
      enterEditMode();

      expect((screen.getByLabelText(/task title/i) as HTMLInputElement).value).toBe(
        'Original Task',
      );
      expect(
        (screen.getByLabelText(/task description/i) as HTMLTextAreaElement).value,
      ).toBe('Original description');
      expect(
        (screen.getByLabelText(/task priority/i) as HTMLSelectElement).value,
      ).toBe('Medium');
      expect(
        (document.getElementById('dueDate') as HTMLInputElement).value,
      ).toBe('2024-12-31');
    });

    it('should show character count for title', () => {
      renderModal();
      enterEditMode();
      // "Original Task" = 13 characters
      expect(screen.getByText('13/200')).toBeInTheDocument();
    });

    it('should render Save Changes and Cancel buttons', () => {
      renderModal();
      enterEditMode();
      expect(
        screen.getByRole('button', { name: /save task changes/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel editing/i }),
      ).toBeInTheDocument();
    });

    it('should update title value when editing', () => {
      renderModal();
      enterEditMode();

      const titleInput = screen.getByLabelText(/task title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      expect(titleInput.value).toBe('Updated Task');
      expect(screen.getByText('12/200')).toBeInTheDocument();
    });

    it('should update description value when editing', () => {
      renderModal();
      enterEditMode();

      const textarea = screen.getByLabelText(
        /task description/i,
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: 'Updated description' },
      });

      expect(textarea.value).toBe('Updated description');
    });

    it('should update priority when selecting different option', () => {
      renderModal();
      enterEditMode();

      const select = screen.getByLabelText(
        /task priority/i,
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'High' } });

      expect(select.value).toBe('High');
    });

    it('should update due date when changing date', () => {
      renderModal();
      enterEditMode();

      const dateInput = document.getElementById('dueDate') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

      expect(dateInput.value).toBe('2025-01-15');
    });

    it('should exit edit mode when Cancel is clicked', () => {
      renderModal();
      enterEditMode();
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /cancel editing/i }));

      // Should revert to view mode
      expect(
        screen.getByRole('heading', { name: 'Original Task' }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/task title/i)).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Form Validation
  // ════════════════════════════════════════════════════════════════════════

  describe('Form Validation', () => {
    it('should show error when submitting with empty title', async () => {
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: '' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when submitting with whitespace-only title', async () => {
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: '   ' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not show error when valid title is provided', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'Valid Title' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(
          screen.queryByText('Title is required'),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Form Submission
  // ════════════════════════════════════════════════════════════════════════

  describe('Form Submission', () => {
    it('should call onSubmit with task id and updated data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'Updated Task' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'Updated Task',
          description: 'Original description',
          priority: 'Medium',
          dueDate: '2024-12-31',
        });
      });
    });

    it('should call onSubmit with all updated fields', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: 'New Title' },
      });
      fireEvent.change(screen.getByLabelText(/task description/i), {
        target: { value: 'New Description' },
      });
      fireEvent.change(screen.getByLabelText(/task priority/i), {
        target: { value: 'Low' },
      });
      fireEvent.change(document.getElementById('dueDate') as HTMLInputElement, {
        target: { value: '2025-06-15' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'New Title',
          description: 'New Description',
          priority: 'Low',
          dueDate: '2025-06-15',
        });
      });
    });

    it('should trim whitespace from title and description', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task title/i), {
        target: { value: '  Trimmed  ' },
      });
      fireEvent.change(screen.getByLabelText(/task description/i), {
        target: { value: '  Desc  ' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          title: 'Trimmed',
          description: 'Desc',
          priority: 'Medium',
          dueDate: '2024-12-31',
        });
      });
    });

    it('should send undefined for empty description', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(screen.getByLabelText(/task description/i), {
        target: { value: '' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'task-1',
          expect.objectContaining({ description: undefined }),
        );
      });
    });

    it('should send undefined for empty due date', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderModal();
      enterEditMode();

      fireEvent.change(document.getElementById('dueDate') as HTMLInputElement, {
        target: { value: '' },
      });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          'task-1',
          expect.objectContaining({ dueDate: undefined }),
        );
      });
    });

    it('should show error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Update failed'));
      renderModal();
      enterEditMode();

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('should show generic error for non-Error rejection', async () => {
      mockOnSubmit.mockRejectedValue('Unknown error');
      renderModal();
      enterEditMode();

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to update task'),
        ).toBeInTheDocument();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Actions
  // ════════════════════════════════════════════════════════════════════════

  describe('Actions', () => {
    it('should call onCancel when clicking backdrop', () => {
      const { container } = renderModal();
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking inside modal content', () => {
      renderModal();
      fireEvent.click(screen.getByRole('heading', { name: 'Original Task' }));
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when pressing Escape in view mode', () => {
      renderModal();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should exit edit mode (not close) when pressing Escape in edit mode', () => {
      renderModal();
      enterEditMode();
      expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      // Should be back in view mode, not closed
      expect(
        screen.getByRole('heading', { name: 'Original Task' }),
      ).toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onDelete when Delete is clicked in overflow menu', () => {
      renderModal({ onDelete: mockOnDelete });
      fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
      fireEvent.click(screen.getByText('Delete task'));
      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
    });

    it('should call onToggleComplete when toggle button is clicked', () => {
      renderModal({ onToggleComplete: mockOnToggleComplete });
      fireEvent.click(
        screen.getByRole('button', { name: /mark as complete/i }),
      );
      expect(mockOnToggleComplete).toHaveBeenCalledWith('task-1');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Accessibility
  // ════════════════════════════════════════════════════════════════════════

  describe('Accessibility', () => {
    it('should have dialog role and aria-modal', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper tab ARIA attributes', () => {
      renderModal();
      const subtasksTab = screen.getByRole('tab', { name: /subtasks/i });
      expect(subtasksTab).toHaveAttribute('aria-selected', 'true');
      expect(subtasksTab).toHaveAttribute('aria-controls', 'tabpanel-subtasks');

      const commentsTab = screen.getByRole('tab', { name: /comments/i });
      expect(commentsTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have tablist role on tab bar', () => {
      renderModal();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have tabpanel role on tab content', () => {
      renderModal();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should have close button with aria-label', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should have form with aria-label in edit mode', () => {
      renderModal();
      enterEditMode();
      expect(screen.getByRole('form')).toHaveAttribute(
        'aria-label',
        'Edit task form',
      );
    });
  });
});
