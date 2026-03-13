import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { InvitationCard } from '../../src/features/sharing/components/InvitationCard';
import { sharingService } from '../../src/services/sharingService';
import type { EventShareInvitation } from '../../src/services/sharingService';

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

const pendingShare: EventShareInvitation = {
  shareId: 'share-1',
  eventId: 'event-1',
  eventTitle: 'Team Planning Session',
  eventStartDate: '2026-01-15T09:00:00Z',
  eventEndDate: '2026-01-15T10:00:00Z',
  sharedBy: { id: 'user-2', username: 'alice' },
  permission: 'View',
  createdAt: '2026-01-01T00:00:00Z',
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('InvitationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingService.getPendingInvitations.mockResolvedValue([]);
  });

  it('renders Accept and Decline buttons', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <InvitationCard share={pendingShare} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
  });

  it('calls sharingService.acceptInvitation with shareId on Accept click', async () => {
    mockSharingService.acceptInvitation.mockResolvedValue(undefined);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <InvitationCard share={pendingShare} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Accept/i }));

    await waitFor(() => {
      expect(mockSharingService.acceptInvitation).toHaveBeenCalledWith('share-1');
    });
  });

  it('calls sharingService.declineInvitation with shareId on Decline click', async () => {
    mockSharingService.declineInvitation.mockResolvedValue(undefined);
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <InvitationCard share={pendingShare} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Decline/i }));

    await waitFor(() => {
      expect(mockSharingService.declineInvitation).toHaveBeenCalledWith('share-1');
    });
  });

  it('shows permission level', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <InvitationCard share={pendingShare} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/View access/)).toBeInTheDocument();
  });

  it('shows sharer username', () => {
    const queryClient = createQueryClient();
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <InvitationCard share={pendingShare} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/@alice/)).toBeInTheDocument();
  });
});
