import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { focusRing } from '@finance-manager/ui/styles';
import { CheckCircle, XCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import {
  CenteredContainer,
  FormCard,
  Heading2,
  Text,
  Button,
  Alert,
  LoadingSpinner,
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

const IconWrapper = styled.div<{ $variant: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background-color: ${({ $variant, theme }) =>
    $variant === 'success' ? theme.colors.successBackground : theme.colors.errorBackground};
  color: ${({ $variant, theme }) =>
    $variant === 'success' ? theme.colors.success : theme.colors.error};
`;

const LinkContainer = styled.div`
  text-align: center;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setVerified(true);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to verify email. The link may be invalid or expired.'));
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isVerifying) {
    return (
      <CenteredContainer>
        <LoadingSpinner />
        <CenteredText>Verifying your email...</CenteredText>
      </CenteredContainer>
    );
  }

  if (verified) {
    return (
      <CenteredContainer>
        <FormCard>
          <IconWrapper $variant="success">
            <CheckCircle size={40} />
          </IconWrapper>
          <Heading2 style={{ textAlign: 'center' }}>Email Verified!</Heading2>
          <CenteredText>
            Your email has been successfully verified. You can now access all features of your account.
          </CenteredText>
          <Alert variant="success">
            Your account is now fully activated. You can log in and start using the application.
          </Alert>
          <LinkContainer>
            <Button onClick={() => navigate('/login')} fullWidth>
              Go to Login
            </Button>
          </LinkContainer>
        </FormCard>
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <FormCard>
        <IconWrapper $variant="error">
          <XCircle size={40} />
        </IconWrapper>
        <Heading2 style={{ textAlign: 'center' }}>Verification Failed</Heading2>
        <Alert variant="error">{error}</Alert>
        <LinkContainer>
          <StyledLink to="/resend-verification">Resend verification email</StyledLink>
          <StyledLink to="/login">Return to login</StyledLink>
        </LinkContainer>
      </FormCard>
    </CenteredContainer>
  );
};

export default VerifyEmailPage;
