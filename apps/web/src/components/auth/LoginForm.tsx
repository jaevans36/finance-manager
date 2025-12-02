import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
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

const LinkContainer = styled.div`
  margin-top: 15px;
  text-align: center;
`;

const StyledLink = styled(Link)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const SignupText = styled.p`
  margin-top: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
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
      const response = await authService.login(email, password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Login failed. Please check your credentials.');
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <Heading>Sign In</Heading>
      
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
            autoComplete="email"
            hasError={!!errors.email}
            disabled={isLoading}
          />
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
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
            autoComplete="current-password"
            hasError={!!errors.password}
            disabled={isLoading}
          />
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <SubmitButton type="submit" disabled={isLoading} isLoading={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </SubmitButton>
      </form>

      <LinkContainer>
        <StyledLink to="/forgot-password">Forgot your password?</StyledLink>
      </LinkContainer>

      <SignupText>
        Don&apos;t have an account? <StyledLink to="/register">Create one</StyledLink>
      </SignupText>
    </FormContainer>
  );
};
