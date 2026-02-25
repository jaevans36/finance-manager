import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { focusRing } from '@finance-manager/ui/styles';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import {
  CenteredContainer,
  FormCard,
  Heading2,
  Text,
  FormGroup,
  Input,
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link');
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
          setError('This reset link is invalid or has expired');
        }
      } catch (err: unknown) {
        setError('Failed to verify reset link');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token!, password);
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please log in with your new password.' } 
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsSubmitting(false);
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
          <Alert variant="error">{error}</Alert>
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
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="error">{error}</Alert>}
          <FormGroup>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="New password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              minLength={8}
            />
          </FormGroup>
          <FormGroup>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              minLength={8}
            />
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
