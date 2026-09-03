import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { PotForm } from '../../src/components/finance/PotForm';
import type { Category } from '../../src/types/finance';

jest.mock('../../src/services/pot-service', () => ({
  potService: { createPot: jest.fn() },
}));

const { potService } = jest.requireMock('../../src/services/pot-service');

const mockCategories: Category[] = [
  { id: 'c1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
];

describe('PotForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a normal pot with budget amount and selected categories', async () => {
    const user = userEvent.setup();
    potService.createPot.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/e.g. groceries/i), 'Food');
    await user.type(screen.getByPlaceholderText(/^amount$/i), '300');
    await user.click(screen.getByLabelText('Groceries'));
    await user.click(screen.getByRole('button', { name: /save pot/i }));

    await waitFor(() => expect(potService.createPot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Food', type: 'Custom', budgetAmount: 300, categoryIds: ['c1'] })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('requires a budget amount for a normal pot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/e.g. groceries/i), 'Food');
    await user.click(screen.getByRole('button', { name: /save pot/i }));

    await waitFor(() => expect(screen.getByText(/budget amount must be greater than zero/i)).toBeInTheDocument());
    expect(potService.createPot).not.toHaveBeenCalled();
  });

  it('switches to sinking fund fields when that type is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={jest.fn()} />);

    await user.selectOptions(screen.getByRole('combobox'), 'SinkingFund');

    expect(screen.getByPlaceholderText(/e.g. 600/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^amount$/i)).not.toBeInTheDocument();
  });

  it('shows the derived monthly allocation for a sinking fund', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={jest.fn()} />);

    await user.selectOptions(screen.getByRole('combobox'), 'SinkingFund');
    await user.type(screen.getByPlaceholderText(/e.g. 600/i), '600');

    expect(screen.getByText(/£50\.00/)).toBeInTheDocument();
  });

  it('creates a sinking fund with the annual amount', async () => {
    const user = userEvent.setup();
    potService.createPot.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/e.g. groceries/i), 'Car insurance');
    await user.selectOptions(screen.getByRole('combobox'), 'SinkingFund');
    await user.type(screen.getByPlaceholderText(/e.g. 600/i), '600');
    await user.click(screen.getByRole('button', { name: /save pot/i }));

    await waitFor(() => expect(potService.createPot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Car insurance', type: 'SinkingFund', annualAmount: 600, categoryIds: [] })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('requires an annual amount for a sinking fund', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PotForm categories={mockCategories} onSuccess={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/e.g. groceries/i), 'Car insurance');
    await user.selectOptions(screen.getByRole('combobox'), 'SinkingFund');
    await user.click(screen.getByRole('button', { name: /save pot/i }));

    await waitFor(() => expect(screen.getByText(/annual amount must be greater than zero/i)).toBeInTheDocument());
    expect(potService.createPot).not.toHaveBeenCalled();
  });
});
