import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import DevPasswordResetPage from '../../src/pages/dev/DevPasswordResetPage';
import { devService } from '../../src/services/devService';

jest.mock('../../src/services/devService');
const mockDevService = devService as jest.Mocked<typeof devService>;

describe('DevPasswordResetPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dev warning banner', () => {
    render(<DevPasswordResetPage />);
    expect(screen.getByText(/Dev mode only/i)).toBeInTheDocument();
  });

  it('renders email, new password, and confirm password fields', () => {
    render(<DevPasswordResetPage />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
  });

  it('shows the password requirements checklist', () => {
    render(<DevPasswordResetPage />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One digit')).toBeInTheDocument();
  });

  it('marks requirements met in green as the password is typed', () => {
    render(<DevPasswordResetPage />);
    const requirementRow = (label: string) => screen.getByText(label).closest('div')!;

    expect(requirementRow('At least 8 characters')).toHaveClass('text-destructive');
    expect(requirementRow('One uppercase letter')).toHaveClass('text-destructive');
    expect(requirementRow('One digit')).toHaveClass('text-destructive');

    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });

    expect(requirementRow('At least 8 characters')).toHaveClass('text-success');
    expect(requirementRow('One uppercase letter')).toHaveClass('text-success');
    expect(requirementRow('One digit')).toHaveClass('text-success');
  });

  it('shows error when passwords do not match', async () => {
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Different1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('calls devService.resetPassword with correct args and shows success', async () => {
    mockDevService.resetPassword.mockResolvedValue(undefined);
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'jay@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/Password reset successfully/i)).toBeInTheDocument();
    expect(mockDevService.resetPassword).toHaveBeenCalledWith('jay@example.com', 'Password1');
  });

  it('shows API error message on failure', async () => {
    mockDevService.resetPassword.mockRejectedValue({
      response: { data: { error: { message: 'User not found' } } },
    });
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'nobody@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });
});
