import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetWorthDashboard } from '../../src/components/finance/NetWorthDashboard';
import { accountsService } from '../../src/services/accounts-service';
import { assetsService } from '../../src/services/assets-service';

jest.mock('../../src/services/accounts-service');
jest.mock('../../src/services/assets-service');

const mockGetNetWorth = accountsService.getNetWorth as jest.MockedFunction<typeof accountsService.getNetWorth>;
const mockGetNetWorthHistory = accountsService.getNetWorthHistory as jest.MockedFunction<typeof accountsService.getNetWorthHistory>;
const mockGetAssets = assetsService.getAssets as jest.MockedFunction<typeof assetsService.getAssets>;
const mockDeleteAsset = assetsService.deleteAsset as jest.MockedFunction<typeof assetsService.deleteAsset>;

const mockHistory = [
  { month: 8, year: 2026, monthLabel: 'Aug 2026', netWorth: 10000 },
  { month: 9, year: 2026, monthLabel: 'Sep 2026', netWorth: 12000 },
];

const mockAssets = [
  { id: 'asset-1', name: 'The house', type: 'Property' as const, value: 350000, notes: null, createdAt: '', updatedAt: '' },
];

describe('NetWorthDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNetWorth.mockResolvedValue({ netWorth: 362000 });
    mockGetNetWorthHistory.mockResolvedValue(mockHistory);
    mockGetAssets.mockResolvedValue(mockAssets);
  });

  it('shows loading skeletons initially', () => {
    render(<NetWorthDashboard />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the net worth figure including assets', async () => {
    render(<NetWorthDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/362,000/)).toBeInTheDocument();
    });
  });

  it('renders the asset total summary line', async () => {
    render(<NetWorthDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Includes £350,000\.00 across 1 tracked asset/)).toBeInTheDocument();
    });
  });

  it('renders the asset list', async () => {
    render(<NetWorthDashboard />);
    await waitFor(() => {
      expect(screen.getByText('The house')).toBeInTheDocument();
    });
  });

  it('shows an empty state when there are no assets', async () => {
    mockGetAssets.mockResolvedValue([]);
    render(<NetWorthDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument();
    });
  });

  it('shows the Add asset form when clicked, and hides it on cancel', async () => {
    const user = userEvent.setup();
    render(<NetWorthDashboard />);
    await waitFor(() => expect(screen.getByText('The house')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add asset/i }));
    expect(screen.getByText('New asset')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('New asset')).not.toBeInTheDocument();
  });

  it('deletes an asset after confirming', async () => {
    const user = userEvent.setup();
    mockDeleteAsset.mockResolvedValue(undefined);
    render(<NetWorthDashboard />);
    await waitFor(() => expect(screen.getByText('The house')).toBeInTheDocument());

    await user.click(screen.getByTitle('Delete asset'));
    await user.click(screen.getByRole('button', { name: /yes, delete/i }));

    await waitFor(() => expect(mockDeleteAsset).toHaveBeenCalledWith('asset-1'));
  });
});
