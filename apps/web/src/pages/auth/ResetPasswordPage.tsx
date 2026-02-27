import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { focusRing } from '@finance-manager/ui/styles';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { useResetPasswordForm } from '../../hooks/forms';
import type { ResetPasswordInput } from '@finance-manager/schema';
import {
  CenteredContainer,
  FormCard,
  Heading2,
  Text,
  FormGroup,
  Input,
  ErrorText,
  Button,
  Alert,
  LoadingSpinner,
} from '@finance-manager/ui';

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  text-decoration: none;
  ${focusRing}

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

const CenteredText = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LinkContainer = styled.div`
  text-align: center;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useResetPasswordForm();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setApiError('Invalid reset link');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await authService.verifyResetToken(token);
        setTokenValid(result.valid);
        if (result.email) {
          setEmail(result.email);
        }
        if (!result.valid) {
          setApiError('This reset link is invalid or has expired');
        }
      } catch (err: unknown) {
        setApiError('Failed to verify reset link');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setApiError('');

    try {
      await authService.resetPassword(token!, data.password);
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please log in with your new password.' } 
      });
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'Failed to reset password'));
    }
  };

  if (isVerifying) {
    return (
      <CenteredContainer>
        <LoadingSpinner />
        <CenteredText>Verifying reset link...</CenteredText>
      </CenteredContainer>
    );
  }

  if (!tokenValid) {
    return (
      <CenteredContainer>
        <FormCard>
          <Heading2 style={{ textAlign: 'center' }}>Invalid Reset Link</Heading2>
          <Alert variant="error">{apiError}</Alert>
          <LinkContainer>
            <StyledLink to="/forgot-password">Request a new reset link</StyledLink>
            <StyledLink to="/login">Return to login</StyledLink>
          </LinkContainer>
        </FormCard>
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <FormCard>
        <Heading2 style={{ textAlign: 'center' }}>Set new password</Heading2>
        {email && (
          <CenteredText>
            for <strong>{email}</strong>
          </CenteredText>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          {apiError && <Alert variant="error">{apiError}</Alert>}
          <FormGroup>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="New password (min. 8 characters)"
              {...register('password')}
              hasError={!!errors.password}
              disabled={isSubmitting}
            />
            {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          </FormGroup>
          <FormGroup>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              hasError={!!errors.confirmPassword}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && <ErrorText>{errors.confirmPassword.message}</ErrorText>}
          </FormGroup>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Resetting password...' : 'Reset password'}
          </Button>
        </form>
      </FormCard>
    </CenteredContainer>
  );
};

export default ResetPasswordPage;
