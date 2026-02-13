import styled from 'styled-components';
import { Card, Text } from '@finance-manager/ui';
import { borderRadius, shadows } from '../../../styles/layout';

const ErrorContainer = styled(Card)`
  padding: 20px;
  background: ${({ theme }) => theme.colors.errorBackground};
  border: 1px solid ${({ theme }) => theme.colors.error}33;
`;

const ErrorTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.errorText};
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ErrorIcon = styled.span`
  font-size: 24px;
`;

const ErrorMessage = styled(Text)`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const RetryButton = styled.button`
  margin-top: 16px;
  padding: 8px 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.buttonText};
  border: none;
  border-radius: ${borderRadius.sm};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  icon?: string;
}

export const ErrorDisplay = ({
  message,
  onRetry,
  title = 'Error Loading Data',
  icon = '⚠️',
}: ErrorDisplayProps) => {
  return (
    <ErrorContainer>
      <ErrorTitle>
        <ErrorIcon>{icon}</ErrorIcon>
        {title}
      </ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>
      {onRetry && (
        <RetryButton onClick={onRetry}>
          Try Again
        </RetryButton>
      )}
    </ErrorContainer>
  );
};
