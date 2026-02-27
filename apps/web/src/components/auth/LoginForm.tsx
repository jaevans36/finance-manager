import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useLoginForm } from '../../hooks/forms';
import type { LoginInput } from '@finance-manager/schema';
import { 
  FormGroup, 
  Label, 
  Input, 
  ErrorText, 
  Button, 
  Alert,
  Heading2,
} from '@finance-manager/ui';
import styled from 'styled-components';
import { focusRing } from '@finance-manager/ui/styles';

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
  ${focusRing}

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
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useLoginForm();

  const onSubmit = async (data: LoginInput) => {
    setApiError('');

    try {
      const response = await authService.login(data.emailOrUsername, data.password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Login failed. Please check your credentials.');
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
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

      <form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
        <FormGroup>
          <Label htmlFor="emailOrUsername">Email or Username</Label>
          <Input
            id="emailOrUsername"
            type="text"
            {...register('emailOrUsername')}
            autoComplete="username"
            hasError={!!errors.emailOrUsername}
            disabled={isSubmitting}
            placeholder="Enter your email or username"
            aria-required="true"
            aria-invalid={!!errors.emailOrUsername}
            aria-describedby={errors.emailOrUsername ? 'email-error' : undefined}
          />
          {errors.emailOrUsername && <ErrorText>{errors.emailOrUsername.message}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            autoComplete="current-password"
            hasError={!!errors.password}
            disabled={isSubmitting}
            placeholder="Enter your password"
          />
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
        </FormGroup>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          $isLoading={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
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
