import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';
import { borderRadius } from '@finance-manager/ui/styles';

interface ChartContainerProps {
  children: ReactNode;
  height?: number;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

const Container = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  min-height: ${props => props.height}px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingOverlay = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

const ErrorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg};
  padding: 20px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin: 0 0 16px 0;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${borderRadius.sm};
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

class ChartErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void; height: number },
  ChartErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onRetry?: () => void; height: number }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container height={this.props.height}>
          <ErrorContainer role="alert" aria-live="assertive">
            <ErrorIcon aria-hidden="true">⚠️</ErrorIcon>
            <ErrorTitle>Chart Error</ErrorTitle>
            <ErrorMessage>
              Unable to render chart: {this.state.error?.message || 'Unknown error'}
            </ErrorMessage>
            {this.props.onRetry && (
              <RetryButton onClick={this.handleRetry} aria-label="Retry loading chart">
                Retry
              </RetryButton>
            )}
          </ErrorContainer>
        </Container>
      );
    }

    return this.props.children;
  }
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  height = 300,
  loading = false,
  error,
  onRetry,
  title,
  description,
}) => {
  if (loading) {
    return (
      <Container height={height}>
        <LoadingOverlay role="status" aria-live="polite" aria-label={`Loading ${title || 'chart'}`}>
          <LoadingSpinner aria-hidden="true" />
          <LoadingText>Loading {title || 'chart'}...</LoadingText>
        </LoadingOverlay>
      </Container>
    );
  }

  if (error) {
    return (
      <Container height={height}>
        <ErrorContainer role="alert" aria-live="assertive">
          <ErrorIcon aria-hidden="true">❌</ErrorIcon>
          <ErrorTitle>Failed to Load {title || 'Chart'}</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          {onRetry && (
            <RetryButton onClick={onRetry} aria-label={`Retry loading ${title || 'chart'}`}>
              Retry
            </RetryButton>
          )}
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container 
      height={height}
      role="img"
      aria-label={description || title || 'Chart visualization'}
    >
      <ChartErrorBoundary onRetry={onRetry} height={height}>
        <ChartWrapper>
          {children}
        </ChartWrapper>
      </ChartErrorBoundary>
    </Container>
  );
};
