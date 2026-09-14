import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { ChangePasswordSection } from '../../src/pages/profile/ChangePasswordSection';

jest.mock('../../src/services/authService', () => ({
  authService: { changePassword: jest.fn() },
}));

const { authService } = jest.requireMock('../../src/services/authService');

describe('ChangePasswordSection', () => {
  beforeEach(() => jest.clearAllMocks());

  const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /change/i }));
  };

  it('shows a masked placeholder and a Change button by default', () => {
    renderWithProviders(<ChangePasswordSection />);

    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
  });

  it('requires the current password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/^new password/i), 'NewPass123!');
    await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/current password is required/i)).toBeInTheDocument());
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password that does not meet complexity rules', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/current password/i), 'CurrentPass123!');
    await user.type(screen.getByPlaceholderText(/^new password/i), 'weak');
    await user.type(screen.getByPlaceholderText(/confirm new password/i), 'weak');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password that does not match its confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/current password/i), 'CurrentPass123!');
    await user.type(screen.getByPlaceholderText(/^new password/i), 'NewPass123!');
    await user.type(screen.getByPlaceholderText(/confirm new password/i), 'Different123!');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument());
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password with valid fields and collapses the form', async () => {
    const user = userEvent.setup();
    authService.changePassword.mockResolvedValue({ message: 'Password changed successfully.' });
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/current password/i), 'CurrentPass123!');
    await user.type(screen.getByPlaceholderText(/^new password/i), 'NewPass123!');
    await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith('CurrentPass123!', 'NewPass123!'));
    await waitFor(() => expect(screen.queryByPlaceholderText(/current password/i)).not.toBeInTheDocument());
  });

  it('shows a server error and keeps the form open when the current password is wrong', async () => {
    const user = userEvent.setup();
    authService.changePassword.mockRejectedValue(new Error('Current password is incorrect'));
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/current password/i), 'WrongPass123!');
    await user.type(screen.getByPlaceholderText(/^new password/i), 'NewPass123!');
    await user.type(screen.getByPlaceholderText(/confirm new password/i), 'NewPass123!');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText('Current password is incorrect')).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
  });

  it('closes the form and clears fields on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordSection />);
    await openForm(user);

    await user.type(screen.getByPlaceholderText(/current password/i), 'SomeText123!');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByPlaceholderText(/current password/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
  });
});
