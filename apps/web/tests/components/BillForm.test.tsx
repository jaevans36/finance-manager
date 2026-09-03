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
  { id: 'acc-4', name: 'Natwest - Credit Card', type: 'Credit', currency: 'GBP', balance: -1000, institution: null, colour: null, icon: null, isActive: true, excludeFromNetWorth: false, currentMonthlyPayment: 120 },
];

const mockCategories = [
  { id: 'cat-1', name: 'Subscriptions', colour: null, icon: null, isSystem: true, parentId: null, children: null },
  { id: 'cat-2', name: 'Credit Card Payment', colour: null, icon: null, isSystem: true, parentId: null, children: null },
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

  it('warns when the entered amount disagrees with the linked account’s current payment', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    renderWithProviders(
      <BillForm onSuccess={jest.fn()} billId="b1" defaultName="Natwest DD" defaultAmount={100} defaultAccountId="acc-4" />
    );

    await waitFor(() => expect(screen.getByDisplayValue('Natwest - Credit Card (Credit)')).toBeInTheDocument());

    expect(screen.getByText(/already shows £120\.00\/mo/i)).toBeInTheDocument();
    expect(screen.getByText(/works out to £100\.00\/mo/i)).toBeInTheDocument();
  });

  it('does not warn when the entered amount matches the linked account’s current payment', async () => {
    accountsService.getAccounts.mockResolvedValue(mockAccounts);
    renderWithProviders(
      <BillForm onSuccess={jest.fn()} billId="b1" defaultName="Natwest DD" defaultAmount={120} defaultAccountId="acc-4" />
    );

    await waitFor(() => expect(screen.getByDisplayValue('Natwest - Credit Card (Credit)')).toBeInTheDocument());

    expect(screen.queryByText(/already shows/i)).not.toBeInTheDocument();
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

  // ── Category ───────────────────────────────────────────────────────────

  it('does not render category selector when no categories are provided', () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} />);
    expect(screen.queryByText(/^category$/i)).not.toBeInTheDocument();
  });

  it('renders category selector with all categories when provided', () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} categories={mockCategories} />);
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Credit Card Payment')).toBeInTheDocument();
    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('pre-selects category when defaultCategoryId is provided', () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(
      <BillForm onSuccess={jest.fn()} categories={mockCategories} defaultCategoryId="cat-2" />
    );
    const categorySelect = screen.getByDisplayValue('Credit Card Payment') as HTMLSelectElement;
    expect(categorySelect.value).toBe('cat-2');
  });

  it('passes selected categoryId in create request', async () => {
    accountsService.getAccounts.mockResolvedValue([]);
    billService.createBill.mockResolvedValue({ id: 'b1' });

    renderWithProviders(
      <BillForm onSuccess={jest.fn()} categories={mockCategories} defaultName="Netflix" defaultAmount={9.99} />
    );

    const categorySelect = screen.getByDisplayValue('No category');
    await userEvent.selectOptions(categorySelect, 'cat-1');
    await userEvent.click(screen.getByRole('button', { name: /save bill/i }));

    await waitFor(() => {
      expect(billService.createBill).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
      );
    });
  });

  it('submits null categoryId when cleared to "No category" during update', async () => {
    accountsService.getAccounts.mockResolvedValue([]);
    billService.updateBill.mockResolvedValue({ id: 'b1' });

    renderWithProviders(
      <BillForm
        onSuccess={jest.fn()}
        billId="b1"
        categories={mockCategories}
        defaultCategoryId="cat-1"
        defaultName="Netflix"
        defaultAmount={9.99}
      />
    );

    const categorySelect = screen.getByDisplayValue('Subscriptions');
    await userEvent.selectOptions(categorySelect, '');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(billService.updateBill).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({ categoryId: null })
      );
    });
  });

  // ── Weekly due day ─────────────────────────────────────────────────────

  it('shows a day-of-month input for Monthly frequency', () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} defaultFrequency="Monthly" />);
    expect(screen.getByText('Due day (1–31)')).toBeInTheDocument();
  });

  it('shows a weekday selector for Weekly frequency', () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} defaultFrequency="Weekly" defaultDueDay={5} />);
    expect(screen.getByText('Due day')).toBeInTheDocument();
    expect(screen.queryByText('Due day (1–31)')).not.toBeInTheDocument();
    const dueDaySelect = screen.getByDisplayValue('Friday') as HTMLSelectElement;
    expect(dueDaySelect.value).toBe('5');
  });

  it('resets due day when switching frequency between Weekly and non-Weekly', async () => {
    accountsService.getAccounts.mockResolvedValue([]);
    renderWithProviders(<BillForm onSuccess={jest.fn()} defaultFrequency="Monthly" defaultDueDay={15} />);

    await userEvent.selectOptions(screen.getByDisplayValue('Monthly'), 'Weekly');

    const dueDaySelect = screen.getByDisplayValue('Monday') as HTMLSelectElement;
    expect(dueDaySelect.value).toBe('1');
  });

  it('submits the selected ISO weekday as dueDay for Weekly bills', async () => {
    accountsService.getAccounts.mockResolvedValue([]);
    billService.createBill.mockResolvedValue({ id: 'b1' });

    renderWithProviders(
      <BillForm onSuccess={jest.fn()} defaultFrequency="Weekly" defaultName="Cleaner" defaultAmount={25} />
    );

    await userEvent.selectOptions(screen.getByDisplayValue('Monday'), '5');
    await userEvent.click(screen.getByRole('button', { name: /save bill/i }));

    await waitFor(() => {
      expect(billService.createBill).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'Weekly', dueDay: 5 })
      );
    });
  });
});
