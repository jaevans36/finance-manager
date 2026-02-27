import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { CheckIcon, XCircleIcon } from 'lucide-react';
import styled from 'styled-components';
import { borderRadius, focusRing, spacing } from '@finance-manager/ui/styles';
import { useRegisterForm } from '../../hooks/forms';
import type { RegisterInput } from '@finance-manager/schema';

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: ${spacing.xl};
`;

const Heading = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${spacing.xl};
`;

const ErrorAlert = styled.div`
  padding: ${spacing.sm} ${spacing.md};
  margin-bottom: ${spacing.lg};
  background-color: ${({ theme }) => theme.colors.errorBackground};
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.error};
`;

const FormGroup = styled.div`
  margin-bottom: ${spacing.lg};
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  display: block;
  margin-bottom: ${spacing.xs};
  font-weight: 500;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: ${spacing.sm};
  font-size: 14px;
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.inputBorder};
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.inputBorderFocus};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: 12px;
  display: block;
  margin-top: ${spacing.xs};
`;

const PasswordStrengthText = styled.div`
  font-size: 12px;
  margin-top: ${spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StrengthIndicator = styled.strong<{ strength: string }>`
  color: ${({ strength, theme }) => {
    if (strength === 'Strong') return theme.colors.success;
    if (strength === 'Medium') return theme.colors.warning;
    return theme.colors.error;
  }};
`;

const SubmitButton = styled.button<{ isLoading?: boolean }>`
  width: 100%;
  padding: ${spacing.sm} ${spacing.md};
  background-color: ${({ theme, isLoading }) => isLoading ? theme.colors.primaryDisabled : theme.colors.primary};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: ${borderRadius.sm};
  font-size: 16px;
  font-weight: 500;
  cursor: ${({ isLoading }) => isLoading ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const InfoBox = styled.div`
  margin-top: ${spacing.lg};
  padding: ${spacing.sm} ${spacing.md};
  background-color: ${({ theme }) => theme.colors.infoBackground};
  border-radius: ${borderRadius.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.info};
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  ${focusRing}

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const SigninText = styled.p`
  margin-top: ${spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UsernameInputContainer = styled.div`
  position: relative;
`;

const UsernameIcon = styled.div<{ available: boolean }>`
  position: absolute;
  right: ${spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ available, theme }) => available ? theme.colors.success : theme.colors.error};
  display: flex;
  align-items: center;
`;

const UsernameHint = styled.div<{ available: boolean }>`
  font-size: 12px;
  margin-top: 4px;
  color: ${({ available, theme }) => available ? theme.colors.success : theme.colors.textSecondary};
`;

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useRegisterForm();
  const [apiError, setApiError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const watchedUsername = watch('username');
  const watchedPassword = watch('password');

  // Debounced username check
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3 || usernameToCheck.length > 20) {
      setUsernameAvailable(false);
      setUsernameMessage('Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(usernameToCheck)) {
      setUsernameAvailable(false);
      setUsernameMessage('Only letters, numbers, _ and - allowed');
      return;
    }

    try {
      setUsernameChecking(true);
      const result = await authService.checkUsername(usernameToCheck);
      setUsernameAvailable(result.available);
      setUsernameMessage(result.message);
    } catch {
      setUsernameAvailable(false);
      setUsernameMessage('Error checking username');
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!watchedUsername) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(watchedUsername);
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedUsername, checkUsernameAvailability]);

  const onFormSubmit = async (data: RegisterInput) => {
    setApiError('');

    // Additional async check: username must be available
    if (usernameAvailable === false) {
      setApiError(usernameMessage || 'Username is not available');
      return;
    }
    if (usernameAvailable === null) {
      setApiError('Please wait for username validation');
      return;
    }

    try {
      const response = await authService.register(data.email, data.username, data.password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Registration failed. Please try again.');
      } else {
        setApiError('Registration failed. Please try again.');
      }
    }
  };

  const getPasswordStrength = (): string => {
    if (!watchedPassword) return '';
    if (watchedPassword.length < 8) return 'Weak';
    
    let strength = 0;
    if (/[A-Z]/.test(watchedPassword)) strength++;
    if (/[a-z]/.test(watchedPassword)) strength++;
    if (/[0-9]/.test(watchedPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) strength++;

    if (strength === 4) return 'Strong';
    if (strength >= 2) return 'Medium';
    return 'Weak';
  };

  const passwordStrength = getPasswordStrength();

  return (
    <FormContainer>
      <Heading>Create Account</Heading>
      
      {apiError && <ErrorAlert>{apiError}</ErrorAlert>}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            hasError={!!errors.email}
            disabled={isSubmitting}
          />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <UsernameInputContainer>
            <Input
              id="username"
              type="text"
              {...register('username')}
              hasError={!!errors.username}
              disabled={isSubmitting}
              placeholder="Choose a unique username"
            />
            {watchedUsername && !usernameChecking && usernameAvailable !== null && (
              <UsernameIcon available={usernameAvailable}>
                {usernameAvailable ? <CheckIcon size={18} /> : <XCircleIcon size={18} />}
              </UsernameIcon>
            )}
          </UsernameInputContainer>
          {watchedUsername && usernameMessage && (
            <UsernameHint available={usernameAvailable === true}>
              {usernameMessage}
            </UsernameHint>
          )}
          {errors.username && <ErrorText>{errors.username.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            hasError={!!errors.password}
            disabled={isSubmitting}
          />
          {watchedPassword && (
            <PasswordStrengthText>
              Password strength: <StrengthIndicator strength={passwordStrength}>
                {passwordStrength}
              </StrengthIndicator>
            </PasswordStrengthText>
          )}
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            hasError={!!errors.confirmPassword}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && <ErrorText>{errors.confirmPassword.message}</ErrorText>}
        </FormGroup>

        <SubmitButton type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </SubmitButton>
      </form>

      <InfoBox>
        📧 A verification email will be sent to your email address after registration.
      </InfoBox>

      <SigninText>
        Already have an account? <StyledLink to="/login">Sign in</StyledLink>
      </SigninText>
    </FormContainer>
  );
};
