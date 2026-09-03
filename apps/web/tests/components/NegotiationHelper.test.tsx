import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { NegotiationHelper } from '../../src/components/finance/NegotiationHelper';
import type { NegotiationScriptResponse } from '../../src/types/finance';

jest.mock('../../src/services/insights-service', () => ({
  insightsService: {
    getNegotiationScript: jest.fn(),
  },
}));

const { insightsService } = jest.requireMock('../../src/services/insights-service');

const makeScript = (overrides: Partial<NegotiationScriptResponse> = {}): NegotiationScriptResponse => ({
  merchantName: 'SKY BROADBAND',
  tenureMonths: 12,
  totalSpent: 360,
  averageMonthlyAmount: 30,
  paymentCount: 12,
  paymentConsistencyPct: 100,
  script: 'Hi, thanks for being a loyal SKY BROADBAND customer for 12 months.',
  disclaimer: 'This is a suggestion — always review before sending.',
  ...overrides,
});

describe('NegotiationHelper', () => {
  const writeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables Generate Script until a provider is selected', () => {
    renderWithProviders(<NegotiationHelper merchants={['SKY BROADBAND']} request={null} />);

    expect(screen.getByRole('button', { name: 'Generate Script' })).toBeDisabled();
  });

  it('generates a script for the selected merchant', async () => {
    const user = userEvent.setup();
    insightsService.getNegotiationScript.mockResolvedValue(makeScript());

    renderWithProviders(<NegotiationHelper merchants={['SKY BROADBAND']} request={null} />);

    await user.selectOptions(screen.getByRole('combobox'), 'SKY BROADBAND');
    await user.click(screen.getByRole('button', { name: 'Generate Script' }));

    await waitFor(() => {
      expect(screen.getByText(/loyal SKY BROADBAND customer/)).toBeInTheDocument();
    });
  });

  it('auto-generates when a negotiation request is passed in', async () => {
    insightsService.getNegotiationScript.mockResolvedValue(makeScript());

    renderWithProviders(
      <NegotiationHelper merchants={['SKY BROADBAND']} request={{ merchant: 'SKY BROADBAND', requestId: 1 }} />
    );

    await waitFor(() => {
      expect(insightsService.getNegotiationScript).toHaveBeenCalledWith('SKY BROADBAND');
    });
  });

  it('shows an error when the merchant has no history', async () => {
    const user = userEvent.setup();
    insightsService.getNegotiationScript.mockRejectedValue(new Error('not found'));

    renderWithProviders(<NegotiationHelper merchants={['SKY BROADBAND']} request={null} />);

    await user.selectOptions(screen.getByRole('combobox'), 'SKY BROADBAND');
    await user.click(screen.getByRole('button', { name: 'Generate Script' }));

    await waitFor(() => {
      expect(screen.getByText(/no transaction history found/i)).toBeInTheDocument();
    });
  });

  it('copies the script to the clipboard when Copy is clicked', async () => {
    const user = userEvent.setup();
    insightsService.getNegotiationScript.mockResolvedValue(makeScript());

    // userEvent.setup() installs its own clipboard stub, so define ours after
    // it runs to keep it in place for the assertion below.
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(<NegotiationHelper merchants={['SKY BROADBAND']} request={null} />);

    await user.selectOptions(screen.getByRole('combobox'), 'SKY BROADBAND');
    await user.click(screen.getByRole('button', { name: 'Generate Script' }));

    await waitFor(() => screen.getByRole('button', { name: /copy/i }));
    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(makeScript().script);
  });
});
