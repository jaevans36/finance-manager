import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { AssignTaskModal } from '../../src/features/tasks/components/AssignTaskModal';
import { taskService } from '../../src/services/taskService';
import type { Task } from '../../src/services/taskService';

jest.mock('../../src/services/taskService', () => ({
  taskService: {
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
  },
}));

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

const baseTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: null,
  priority: 'Medium',
  completed: false,
  completedAt: null,
  dueDate: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  status: 'NotStarted',
  startedAt: null,
  blockedReason: null,
  urgency: null,
  importance: null,
  quadrant: null,
  energyLevel: null,
  estimatedMinutes: null,
  groupId: null,
  groupName: null,
  groupColour: null,
  parentTaskId: null,
  hasSubtasks: false,
  subtaskCount: 0,
  completedSubtaskCount: 0,
  progressPercentage: 0,
  assignedToUserId: null,
  assignedToUsername: null,
  assignedByUserId: null,
  assignedByUsername: null,
  isOwner: true,
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('AssignTaskModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal title', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={baseTask} onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Assign Task')).toBeInTheDocument();
  });

  it('shows "Assign" label when task has no current assignee', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={baseTask} onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /^Assign$/ })).toBeInTheDocument();
  });

  it('shows current assignee and Unassign button when task is assigned', () => {
    const assignedTask: Task = {
      ...baseTask,
      assignedToUserId: 'user-2',
      assignedToUsername: 'alice',
    };
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={assignedTask} onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Currently assigned to/)).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unassign/ })).toBeInTheDocument();
  });

  it('calls taskService.assignTask on form submit with entered username', async () => {
    mockTaskService.assignTask.mockResolvedValue({ ...baseTask, assignedToUsername: 'bob' });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={baseTask} onClose={onClose} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'bob' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Assign$/ }));

    await waitFor(() => {
      expect(mockTaskService.assignTask).toHaveBeenCalledWith('task-1', 'bob');
    });
  });

  it('calls taskService.unassignTask when Unassign is clicked', async () => {
    mockTaskService.unassignTask.mockResolvedValue(baseTask);
    const assignedTask: Task = { ...baseTask, assignedToUserId: 'user-2', assignedToUsername: 'alice' };
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={assignedTask} onClose={onClose} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Unassign/ }));

    await waitFor(() => {
      expect(mockTaskService.unassignTask).toHaveBeenCalledWith('task-1');
    });
  });

  it('shows error message when assignment fails', async () => {
    mockTaskService.assignTask.mockRejectedValue(new Error('User not found'));
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={baseTask} onClose={onClose} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'unknown@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Assign$/ }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AssignTaskModal task={baseTask} onClose={onClose} />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
