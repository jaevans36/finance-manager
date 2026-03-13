import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import TasksPage from '../../src/pages/tasks/TasksPage';
import { taskService } from '../../src/services/taskService';

jest.mock('../../src/services/taskService', () => ({
  taskService: {
    getTasks: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    classifyTask: jest.fn(),
    setEnergy: jest.fn(),
    setEstimate: jest.fn(),
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
  },
}));

jest.mock('../../src/services/taskGroupService', () => ({
  taskGroupService: { getGroups: jest.fn().mockResolvedValue([]) },
}));

jest.mock('../../src/services/eventService', () => ({
  eventService: {
    getEvents: jest.fn().mockResolvedValue([]),
    createEvent: jest.fn(),
  },
}));

jest.mock('../../src/services/subtaskService', () => ({
  subtaskService: {
    getSubtasks: jest.fn().mockResolvedValue([]),
    bulkCreateSubtasks: jest.fn(),
  },
}));

jest.mock('../../src/services/settingsService', () => ({
  settingsService: {
    getSettings: jest.fn().mockResolvedValue({}),
    updateSettings: jest.fn(),
  },
}));

jest.mock('../../src/services/taskGroupSharingService', () => ({
  taskGroupSharingService: {
    getGroupShares: jest.fn().mockResolvedValue([]),
    createGroupShare: jest.fn(),
    deleteGroupShare: jest.fn(),
  },
}));

jest.mock('../../src/services/statisticsService', () => ({
  statisticsService: {
    getStatistics: jest.fn().mockResolvedValue({}),
    invalidateCache: jest.fn(),
  },
}));

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('TasksPage view filter tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService.getTasks.mockResolvedValue([]);
  });

  it('renders all four view tabs', async () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <TasksPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Mine' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Assigned to me' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Assigned by me' })).toBeInTheDocument();
    });
  });

  it('"All" tab is active by default', async () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <TasksPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('data-state', 'active');
    });
  });

  it('calls getTasks with view=assigned-to-me when that tab is clicked', async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <TasksPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Assigned to me' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Assigned to me' }));

    await waitFor(() => {
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ view: 'assigned-to-me' }),
      );
    });
  });

  it('calls getTasks with view=assigned-by-me when that tab is clicked', async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <TasksPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Assigned by me' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Assigned by me' }));

    await waitFor(() => {
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ view: 'assigned-by-me' }),
      );
    });
  });
});
