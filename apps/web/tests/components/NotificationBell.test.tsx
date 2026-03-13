import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { NotificationBell } from '../../src/components/layout/NotificationBell';
import { notificationService } from '../../src/services/notificationService';

jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getNotifications.mockResolvedValue([]);
    mockNotificationService.markAllRead.mockResolvedValue(undefined);
  });

  it('renders bell button', () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('shows unread count badge when count > 0', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 3 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows "9+" badge when count > 9', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 12 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  it('does not show badge when count is 0', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  it('opens dropdown on bell click', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Notifications/ })).toBeInTheDocument();
    });
  });

  it('has accessible aria-label reflecting unread count', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 2 });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <NotificationBell />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /2 unread notifications/ }),
      ).toBeInTheDocument();
    });
  });
});
