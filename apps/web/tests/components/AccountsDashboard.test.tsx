import { render, screen, waitFor } from '@testing-library/react';
import { AccountsDashboard } from '../../src/components/finance/AccountsDashboard';
import { accountsService } from '../../src/services/accounts-service';

jest.mock('../../src/services/accounts-service');

const mockGetAccounts = accountsService.getAccounts as jest.MockedFunction<typeof accountsService.getAccounts>;
const mockGetNetWorth = accountsService.getNetWorth as jest.MockedFunction<typeof accountsService.getNetWorth>;

const mockAccounts = [
  { id: 'acc-1', name: 'Lloyds Current', type: 'Checking' as const, currency: 'GBP', balance: 1234.56, institution: 'Lloyds', colour: '#3B82F6', icon: null, isActive: true, excludeFromNetWorth: false },
  { id: 'acc-2', name: 'Savings', type: 'Savings' as const, currency: 'GBP', balance: 5000.00, institution: null, colour: null, icon: null, isActive: true, excludeFromNetWorth: false },
];

describe('AccountsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccounts.mockResolvedValue(mockAccounts);
    mockGetNetWorth.mockResolvedValue({ netWorth: 6234.56 });
  });

  it('shows loading skeletons initially', () => {
    render(<AccountsDashboard />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders account names after loading', async () => {
    render(<AccountsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Lloyds Current')).toBeInTheDocument();
      // "Savings" appears in both the account name and the type label — check the account name specifically
      const allSavings = screen.getAllByText('Savings');
      expect(allSavings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders net worth value', async () => {
    render(<AccountsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/6,234\.56/)).toBeInTheDocument();
    });
  });

  it('renders Add account button', async () => {
    render(<AccountsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/add account/i)).toBeInTheDocument();
    });
  });

  it('calls onAccountSelect when an account is clicked', async () => {
    const onAccountSelect = jest.fn();
    render(<AccountsDashboard onAccountSelect={onAccountSelect} />);
    await waitFor(() => screen.getByText('Lloyds Current'));
    screen.getByText('Lloyds Current').closest('button')?.click();
    expect(onAccountSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'acc-1' }));
  });

  it('shows error when accounts fail to load', async () => {
    mockGetAccounts.mockRejectedValue(new Error('Network error'));
    mockGetNetWorth.mockRejectedValue(new Error('Network error'));
    render(<AccountsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
