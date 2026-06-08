import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountForm } from '../../src/components/finance/AccountForm';
import { accountsService } from '../../src/services/accounts-service';

jest.mock('../../src/services/accounts-service');

const mockCreate = accountsService.createAccount as jest.MockedFunction<typeof accountsService.createAccount>;

const mockAccount = {
  id: 'acc-1',
  userId: 'user-1',
  name: 'My Current Account',
  type: 'Checking' as const,
  currency: 'GBP',
  balance: 1000,
  institution: 'Lloyds',
  accountNumberSuffix: '1234',
  isActive: true,
  excludeFromNetWorth: false,
  colour: null,
  icon: null,
  notes: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('AccountForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders name, type, currency and institution fields', () => {
    render(<AccountForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/institution/i)).toBeInTheDocument();
  });

  it('calls createAccount with correct data on submit', async () => {
    mockCreate.mockResolvedValue(mockAccount);
    const onSuccess = jest.fn();

    render(<AccountForm onSuccess={onSuccess} onCancel={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'My Savings' } });
    fireEvent.change(screen.getByLabelText(/institution/i), { target: { value: 'Nationwide' } });
    fireEvent.click(screen.getByRole('button', { name: /save account/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Savings', institution: 'Nationwide' }));
    });
  });

  it('calls onSuccess after successful creation', async () => {
    mockCreate.mockResolvedValue(mockAccount);
    const onSuccess = jest.fn();

    render(<AccountForm onSuccess={onSuccess} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'Savings' } });
    fireEvent.click(screen.getByRole('button', { name: /save account/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = jest.fn();
    render(<AccountForm onSuccess={jest.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows validation error when name is empty and form is submitted', async () => {
    render(<AccountForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows error message when API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));

    render(<AccountForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /save account/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
