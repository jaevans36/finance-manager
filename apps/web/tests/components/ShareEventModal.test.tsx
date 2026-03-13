import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { ShareEventModal } from '../../src/features/events/components/ShareEventModal';
import { sharingService } from '../../src/services/sharingService';
import type { EventShare } from '../../src/services/sharingService';

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

const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const existingShare: EventShare = {
  id: 'share-1',
  eventId: 'event-1',
  sharedWithUserId: 'user-2',
  username: 'alice',
  email: 'alice@example.com',
  permission: 'View',
  status: 'Accepted',
  createdAt: '2026-01-01T00:00:00Z',
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('ShareEventModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingService.getEventShares.mockResolvedValue([existingShare]);
  });

  it('renders the modal title', async () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Share "Team Meeting"')).toBeInTheDocument();
  });

  it('displays existing shares', async () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('@alice')).toBeInTheDocument();
    });
  });

  it('calls createEventShare on form submit', async () => {
    mockSharingService.createEventShare.mockResolvedValue({
      ...existingShare,
      id: 'share-2',
      username: 'bob',
      email: 'bob@example.com',
    });
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'bob' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));

    await waitFor(() => {
      expect(mockSharingService.createEventShare).toHaveBeenCalledWith('event-1', {
        usernameOrEmail: 'bob',
        permission: 'View',
      });
    });
  });

  it('calls deleteEventShare when revoke button is clicked', async () => {
    mockSharingService.deleteEventShare.mockResolvedValue(undefined);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTitle("Remove @alice's access")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Remove @alice's access"));

    await waitFor(() => {
      expect(mockSharingService.deleteEventShare).toHaveBeenCalledWith('event-1', 'share-1');
    });
  });

  it('shows error when share creation fails', async () => {
    mockSharingService.createEventShare.mockRejectedValue(new Error('User not found'));
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'nobody' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
