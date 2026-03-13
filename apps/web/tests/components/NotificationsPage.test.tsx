import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import NotificationsPage from '../../src/pages/NotificationsPage';
import { notificationService } from '../../src/services/notificationService';
import { sharingService } from '../../src/services/sharingService';
import type { Notification } from '../../src/services/notificationService';

jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

jest.mock('../../src/services/sharingService', () => ({
  sharingService: {
    getEventShares: jest.fn(),
    createEventShare: jest.fn(),
    updateEventShare: jest.fn(),
    deleteEventShare: jest.fn(),
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const sampleNotification: Notification = {
  id: 'notif-1',
  type: 'TaskAssigned',
  entityId: 'task-1',
  entityTitle: 'Fix login bug',
  fromUserId: 'user-2',
  fromUsername: 'alice',
  isRead: false,
  createdAt: '2026-03-10T09:00:00Z',
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
    mockSharingService.getPendingInvitations.mockResolvedValue([]);
    mockNotificationService.markRead.mockResolvedValue(undefined);
    mockNotificationService.markAllRead.mockResolvedValue(undefined);
  });

  it('renders page heading', () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );
    const headings = screen.getAllByRole('heading', { name: 'Notifications' });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows empty state when no notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });
  });

  it('renders notification list items', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument();
      expect(screen.getByText(/@alice assigned you a task/)).toBeInTheDocument();
    });
  });

  it('shows "Mark all read" button when unread notifications exist', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark all read/ })).toBeInTheDocument();
    });
  });

  it('calls markAllRead when "Mark all read" button is clicked', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Mark all read/ }));
    });

    await waitFor(() => {
      expect(mockNotificationService.markAllRead).toHaveBeenCalledTimes(1);
    });
  });

  it('shows inline "Mark read" button for unread notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const markReadBtn = screen.getAllByRole('button', { name: /Mark read/ });
      expect(markReadBtn.length).toBeGreaterThan(0);
    });
  });

  it('calls markRead with notification id on inline mark-read click', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const btn = screen.getAllByRole('button', { name: /Mark read/ })[0];
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(mockNotificationService.markRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('renders pending invitations section when invitations exist', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    mockSharingService.getPendingInvitations.mockResolvedValue([
      {
        id: 'share-1',
        eventId: 'event-1',
        sharedWithUserId: 'user-3',
        username: 'bob',
        email: 'bob@example.com',
        permission: 'View',
        status: 'Pending',
        createdAt: '2026-03-10T08:00:00Z',
      },
    ]);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Pending invitations/i)).toBeInTheDocument();
    });
  });
});
