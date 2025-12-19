import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { CheckIcon, XCircleIcon } from 'lucide-react';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
`;

const Heading = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
`;

const ErrorAlert = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: ${({ theme }) => theme.colors.errorBackground};
  color: ${({ theme }) => theme.colors.error};
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.error};
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.inputBorder};
  border-radius: 4px;
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
  margin-top: 4px;
`;

const PasswordStrengthText = styled.div`
  font-size: 12px;
  margin-top: 5px;
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
  padding: 10px;
  background-color: ${({ theme, isLoading }) => isLoading ? theme.colors.primaryDisabled : theme.colors.primary};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: 4px;
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
  margin-top: 15px;
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.infoBackground};
  border-radius: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.info};
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const SigninText = styled.p`
  margin-top: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UsernameInputContainer = styled.div`
  position: relative;
`;

const UsernameIcon = styled.div<{ available: boolean }>`
  position: absolute;
  right: 10px;
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
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

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
    } catch (error) {
      setUsernameAvailable(false);
      setUsernameMessage('Error checking username');
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (usernameAvailable === false) {
      newErrors.username = usernameMessage || 'Username is not available';
    } else if (usernameAvailable === null) {
      newErrors.username = 'Please wait for username validation';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(email, username, password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Registration failed. Please try again.');
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (): string => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    
    let strength = 0;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength === 4) return 'Strong';
    if (strength >= 2) return 'Medium';
    return 'Weak';
  };

  const passwordStrength = getPasswordStrength();

  return (
    <FormContainer>
      <Heading>Create Account</Heading>
      
      {apiError && <ErrorAlert>{apiError}</ErrorAlert>}

      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: '' });
            }}
            hasError={!!errors.email}
            disabled={isLoading}
          />
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <UsernameInputContainer>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: '' });
              }}
              hasError={!!errors.username}
              disabled={isLoading}
              placeholder="Choose a unique username"
            />
            {username && !usernameChecking && usernameAvailable !== null && (
              <UsernameIcon available={usernameAvailable}>
                {usernameAvailable ? <CheckIcon size={18} /> : <XCircleIcon size={18} />}
              </UsernameIcon>
            )}
          </UsernameInputContainer>
          {username && usernameMessage && (
            <UsernameHint available={usernameAvailable === true}>
              {usernameMessage}
            </UsernameHint>
          )}
          {errors.username && <ErrorText>{errors.username}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: '' });
            }}
            hasError={!!errors.password}
            disabled={isLoading}
          />
          {password && (
            <PasswordStrengthText>
              Password strength: <StrengthIndicator strength={passwordStrength}>
                {passwordStrength}
              </StrengthIndicator>
            </PasswordStrengthText>
          )}
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            hasError={!!errors.confirmPassword}
            disabled={isLoading}
          />
          {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
        </FormGroup>

        <SubmitButton type="submit" disabled={isLoading} isLoading={isLoading}>
          {isLoading ? 'Creating account...' : 'Register'}
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
