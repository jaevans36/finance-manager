import styled from 'styled-components';
import { Card, Text } from '../../../components/ui';

const ErrorContainer = styled(Card)`
  padding: 20px;
  background: rgba(220, 38, 38, 0.05);
  border: 1px solid rgba(220, 38, 38, 0.2);
`;

const ErrorTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #dc2626;
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
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  icon?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  title = 'Error Loading Data',
  icon = '⚠️',
}) => {
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
