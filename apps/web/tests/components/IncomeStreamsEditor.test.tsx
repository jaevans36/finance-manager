import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { IncomeStreamsEditor } from '../../src/components/finance/IncomeStreamsEditor';
import type { AccountSummary, DetectedIncomeResponse, IncomeStream } from '../../src/types/finance';

jest.mock('../../src/services/income-stream-service', () => ({
  incomeStreamService: {
    getStreams: jest.fn(),
    createStream: jest.fn(),
    updateStream: jest.fn(),
    deleteStream: jest.fn(),
    detectFromAccount: jest.fn(),
  },
}));

jest.mock('../../src/services/accounts-service', () => ({
  accountsService: {
    getAccounts: jest.fn(),
  },
}));

const { incomeStreamService } = jest.requireMock('../../src/services/income-stream-service');
const { accountsService } = jest.requireMock('../../src/services/accounts-service');

const makeStream = (overrides: Partial<IncomeStream> = {}): IncomeStream => ({
  id: 's1',
  userId: 'u1',
  name: 'My salary',
  monthlyAmount: 2800,
  accountId: null,
  accountName: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

const makeAccount = (overrides: Partial<AccountSummary> = {}): AccountSummary => ({
  id: 'acc-1',
  name: 'Barclays Current',
  type: 'Checking',
  currency: 'GBP',
  balance: 1000,
  institution: null,
  colour: null,
  icon: null,
  isActive: true,
  excludeFromNetWorth: false,
  ...overrides,
});

const makeDetected = (overrides: Partial<DetectedIncomeResponse> = {}): DetectedIncomeResponse => ({
  detectedMonthlyAmount: 2200,
  transactionCount: 2,
  matchedTransactions: [
    { date: '2026-06-15', payee: 'ACME LTD', description: 'WAGES', amount: 2200 },
  ],
  ...overrides,
});

describe('IncomeStreamsEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    incomeStreamService.getStreams.mockResolvedValue([]);
    accountsService.getAccounts.mockResolvedValue([]);
  });

  it('shows existing income streams', async () => {
    incomeStreamService.getStreams.mockResolvedValue([makeStream()]);

    renderWithProviders(<IncomeStreamsEditor />);

    await waitFor(() => expect(screen.getByText('My salary')).toBeInTheDocument());
    expect(screen.getByText('£2,800')).toBeInTheDocument();
  });

  it('shows the linked account name when a stream has one', async () => {
    incomeStreamService.getStreams.mockResolvedValue([
      makeStream({ accountId: 'acc-1', accountName: 'Barclays Current' }),
    ]);

    renderWithProviders(<IncomeStreamsEditor />);

    await waitFor(() => expect(screen.getByText(/Linked to Barclays Current/)).toBeInTheDocument());
  });

  it('adds a new income stream', async () => {
    const user = userEvent.setup();
    incomeStreamService.createStream.mockResolvedValue(makeStream({ name: "Wife's salary", monthlyAmount: 2200 }));

    renderWithProviders(<IncomeStreamsEditor />);
    await waitFor(() => expect(screen.getByText(/add income stream/i)).toBeInTheDocument());

    await user.click(screen.getByText(/add income stream/i));
    await user.type(screen.getByPlaceholderText(/e.g. my salary/i), "Wife's salary");
    await user.type(screen.getByPlaceholderText(/£ \/ month/i), '2200');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(incomeStreamService.createStream).toHaveBeenCalledWith({
        name: "Wife's salary",
        monthlyAmount: 2200,
        accountId: null,
      })
    );
  });

  it('edits an existing income stream', async () => {
    const user = userEvent.setup();
    incomeStreamService.getStreams.mockResolvedValue([makeStream()]);
    incomeStreamService.updateStream.mockResolvedValue(makeStream({ monthlyAmount: 3200 }));

    renderWithProviders(<IncomeStreamsEditor />);
    await waitFor(() => expect(screen.getByText('My salary')).toBeInTheDocument());

    await user.click(screen.getByTitle('Edit income source'));
    const amountInput = screen.getByDisplayValue('2800');
    await user.clear(amountInput);
    await user.type(amountInput, '3200');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(incomeStreamService.updateStream).toHaveBeenCalledWith('s1', {
        name: 'My salary',
        monthlyAmount: 3200,
        accountId: null,
      })
    );
  });

  it('requires a second click to confirm delete', async () => {
    const user = userEvent.setup();
    incomeStreamService.getStreams.mockResolvedValue([makeStream()]);

    renderWithProviders(<IncomeStreamsEditor />);
    await waitFor(() => expect(screen.getByText('My salary')).toBeInTheDocument());

    await user.click(screen.getByTitle('Delete income source'));
    expect(incomeStreamService.deleteStream).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(incomeStreamService.deleteStream).toHaveBeenCalledWith('s1'));
  });

  it('shows a detected-amount hint when an account is linked in the form, with a use-this-amount action', async () => {
    const user = userEvent.setup();
    accountsService.getAccounts.mockResolvedValue([makeAccount()]);
    incomeStreamService.detectFromAccount.mockResolvedValue(makeDetected());

    renderWithProviders(<IncomeStreamsEditor />);
    await waitFor(() => expect(screen.getByText(/add income stream/i)).toBeInTheDocument());
    await user.click(screen.getByText(/add income stream/i));

    await user.selectOptions(screen.getByRole('combobox'), 'acc-1');

    await waitFor(() => expect(screen.getByText(/detected ~£2,200/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /use this amount/i }));
    expect(screen.getByPlaceholderText(/£ \/ month/i)).toHaveValue(2200);
  });

  it('expands the matched-transaction list when Show is clicked', async () => {
    const user = userEvent.setup();
    accountsService.getAccounts.mockResolvedValue([makeAccount()]);
    incomeStreamService.detectFromAccount.mockResolvedValue(makeDetected());

    renderWithProviders(<IncomeStreamsEditor />);
    await waitFor(() => expect(screen.getByText(/add income stream/i)).toBeInTheDocument());
    await user.click(screen.getByText(/add income stream/i));
    await user.selectOptions(screen.getByRole('combobox'), 'acc-1');
    await waitFor(() => expect(screen.getByText(/detected ~£2,200/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^show$/i }));

    expect(screen.getByText(/ACME LTD/)).toBeInTheDocument();
  });

  it('shows the running total across all streams', async () => {
    incomeStreamService.getStreams.mockResolvedValue([
      makeStream({ id: 's1', name: 'My salary', monthlyAmount: 2800 }),
      makeStream({ id: 's2', name: "Wife's salary", monthlyAmount: 2200 }),
    ]);

    renderWithProviders(<IncomeStreamsEditor />);

    await waitFor(() => expect(screen.getByText('My salary')).toBeInTheDocument());
    expect(screen.getByText('£5,000/mo')).toBeInTheDocument();
  });
});
