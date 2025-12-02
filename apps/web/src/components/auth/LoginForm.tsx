import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { 
  FormGroup, 
  Label, 
  Input, 
  ErrorText, 
  Button, 
  Alert,
  Heading2,
  Flex,
  TextSecondary
} from '../ui';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
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
      <Heading2>Sign In</Heading2>
      
      {apiError && (
        <Alert variant="error">
          <XCircle />
          <span>{apiError}</span>
        </Alert>
      )}

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
            placeholder="Enter your email"
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
            placeholder="Enter your password"
          />
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </FormGroup>

        <Button 
          type="submit" 
          disabled={isLoading} 
          isLoading={isLoading}
          fullWidth
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
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
