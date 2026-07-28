import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { BillForm } from '../../src/components/finance/BillForm';

jest.mock('../../src/services/bill-service', () => ({
  billService: {
    createBill: jest.fn(),
    updateBill: jest.fn(),
  },
}));

jest.mock('../../src/services/accounts-service', () => ({
  accountsService: {
    getAccounts: jest.fn(),
  },
}));

const { billService } = jest.requireMock('../../src/services/bill-service');
const { accountsService } = jest.requireMock('../../src/services/accounts-service');

const mockAccounts = [
  { id: 'acc-1', name: 'Barclays Current', type: 'Checking', currency: 'GBP', balance: 0, institution: null, colour: null, icon: null, isActive: true, excludeFromNetWorth: false },
  { id: 'acc-2', name: 'Monzo', type: 'Checking', currency: 'GBP', balance: 0, institution: null, colour: null, icon: null, isActive: true, excludeFromNetWorth: false },
  { id: 'acc-3', name: 'Barclaycard', type: 'Credit', currency: 'GBP', balance: -500, institution: null, colour: null, icon: null, isActive: true, excludeFromNetWorth: false },
];

describe('BillForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not render account selector when no accounts are available', async () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} />);
    await waitFor(() => expect(accountsService.getAccounts).toHaveBeenCalled());
    expect(screen.queryByText(/linked account/i)).not.toBeInTheDocument();
  });

  it('renders account selector with all accounts when accounts are available', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    renderWithProviders(<BillForm onSuccess={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/linked account/i)).toBeInTheDocument());
    expect(screen.getByText('Barclays Current')).toBeInTheDocument();
    expect(screen.getByText('Monzo')).toBeInTheDocument();
    expect(screen.getByText('Barclaycard (Credit)')).toBeInTheDocument();
    expect(screen.getByText('Not linked')).toBeInTheDocument();
  });

  it('passes selected accountId in create request', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    billService.createBill.mockResolvedValue({ id: 'b1' });
    const onSuccess = jest.fn();

    renderWithProviders(
      <BillForm onSuccess={onSuccess} defaultName="Gym" defaultAmount={40} />
    );

    await waitFor(() => screen.getByText(/linked account/i));
    const accountSelect = screen.getByDisplayValue('Not linked');
    await userEvent.selectOptions(accountSelect, 'acc-1');

    await userEvent.click(screen.getByRole('button', { name: /save bill/i }));

    await waitFor(() => {
      expect(billService.createBill).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'acc-1' })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('pre-selects account when defaultAccountId is provided', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    renderWithProviders(
      <BillForm onSuccess={jest.fn()} billId="b1" defaultAccountId="acc-2" />
    );
    await waitFor(() => screen.getByText(/linked account/i));
    const accountSelect = screen.getByDisplayValue('Monzo') as HTMLSelectElement;
    expect(accountSelect.value).toBe('acc-2');
  });

  it('submits null accountId when no account is selected during update', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    billService.updateBill.mockResolvedValue({ id: 'b1' });
    const onSuccess = jest.fn();

    renderWithProviders(
      <BillForm onSuccess={onSuccess} billId="b1" defaultName="Netflix" defaultAmount={9.99} />
    );

    await waitFor(() => screen.getByText(/linked account/i));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(billService.updateBill).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({ accountId: null })
      );
    });
  });
});
