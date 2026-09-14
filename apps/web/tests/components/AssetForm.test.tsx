import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { AssetForm } from '../../src/components/finance/AssetForm';

jest.mock('../../src/services/assets-service', () => ({
  assetsService: { createAsset: jest.fn(), updateAsset: jest.fn() },
}));

const { assetsService } = jest.requireMock('../../src/services/assets-service');

describe('AssetForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires a name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssetForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /add asset/i }));

    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    expect(assetsService.createAsset).not.toHaveBeenCalled();
  });

  it('rejects a missing value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssetForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/our house/i), 'The car');
    await user.click(screen.getByRole('button', { name: /add asset/i }));

    await waitFor(() => expect(screen.getByText(/value must be zero or greater/i)).toBeInTheDocument());
    expect(assetsService.createAsset).not.toHaveBeenCalled();
  });

  it('creates an asset with the entered fields', async () => {
    const user = userEvent.setup();
    assetsService.createAsset.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(<AssetForm onSuccess={onSuccess} onCancel={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/our house/i), 'The house');
    await user.type(screen.getByPlaceholderText('0.00'), '350000');
    await user.click(screen.getByRole('button', { name: /add asset/i }));

    await waitFor(() => expect(assetsService.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'The house', type: 'Property', value: 350000 })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('updates an existing asset when assetId is provided', async () => {
    const user = userEvent.setup();
    assetsService.updateAsset.mockResolvedValue({});
    const onSuccess = jest.fn();
    renderWithProviders(
      <AssetForm
        assetId="asset-1"
        initialData={{ id: 'asset-1', name: 'The house', type: 'Property', value: 350000, notes: null, createdAt: '', updatedAt: '' }}
        onSuccess={onSuccess}
        onCancel={jest.fn()}
      />
    );

    const valueInput = screen.getByDisplayValue('350000');
    await user.clear(valueInput);
    await user.type(valueInput, '375000');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(assetsService.updateAsset).toHaveBeenCalledWith(
      'asset-1', expect.objectContaining({ value: 375000 })
    ));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows an error message when createAsset fails', async () => {
    const user = userEvent.setup();
    assetsService.createAsset.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<AssetForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

    await user.type(screen.getByPlaceholderText(/our house/i), 'Test');
    await user.type(screen.getByPlaceholderText('0.00'), '100');
    await user.click(screen.getByRole('button', { name: /add asset/i }));

    await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    renderWithProviders(<AssetForm onSuccess={jest.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
