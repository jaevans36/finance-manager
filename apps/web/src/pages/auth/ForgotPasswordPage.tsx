import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from '../../components/ui';

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
`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send reset email'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <CenteredContainer>
        <FormCard>
          <Heading2 style={{ textAlign: 'center' }}>Check your email</Heading2>
          <CenteredText>
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </CenteredText>
          <Alert variant="success">
            If an account exists with this email, you will receive a password reset link shortly.
            The link will expire in 1 hour.
          </Alert>
          <LinkContainer>
            <StyledLink to="/login">Return to login</StyledLink>
          </LinkContainer>
        </FormCard>
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <FormCard>
        <Heading2 style={{ textAlign: 'center' }}>Reset your password</Heading2>
        <CenteredText>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CenteredText>
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="error">{error}</Alert>}
          <FormGroup>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </FormGroup>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </Button>
          <LinkContainer>
            <StyledLink to="/login">Back to login</StyledLink>
          </LinkContainer>
        </form>
      </FormCard>
    </CenteredContainer>
  );
};

export default ForgotPasswordPage;
