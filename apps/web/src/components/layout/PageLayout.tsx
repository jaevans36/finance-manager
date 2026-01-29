import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContentContainer, IconButton, Heading1 } from '../ui';

const Header = styled.div`
  margin-bottom: 30px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 8px 0 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const Content = styled.div`
  /* Content wrapper for additional styling if needed */
`;

interface PageLayoutProps {
  /** Page title displayed as H1 */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Text for the back button */
  backButtonText?: string;
  /** Path to navigate to when back button is clicked */
  backButtonPath?: string;
  /** Optional actions to display below the title (filters, buttons, etc.) */
  headerActions?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Optional loading state */
  loading?: boolean;
  /** Optional error message */
  error?: string | null;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 16px;
`;

/**
 * PageLayout - Consistent layout template for all application pages
 * 
 * Provides:
 * - Consistent ContentContainer wrapper
 * - Optional back button with customizable destination
 * - Page title (H1)
 * - Optional header actions area (filters, buttons, etc.)
 * - Loading and error states
 * - Responsive behavior
 * 
 * @example
 * ```tsx
 * <PageLayout
 *   title="Task Calendar"
 *   showBackButton
 *   backButtonPath="/dashboard"
 *   headerActions={<CalendarFilters {...filterProps} />}
 * >
 *   <YourPageContent />
 * </PageLayout>
 * ```
 */
export const PageLayout = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonText = 'Back to Dashboard',
  backButtonPath = '/dashboard',
  headerActions,
  children,
  loading = false,
  error,
  loadingComponent,
  errorComponent,
}: PageLayoutProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <ContentContainer>
        {loadingComponent || <LoadingMessage>Loading...</LoadingMessage>}
      </ContentContainer>
    );
  }

  if (error) {
    return (
      <ContentContainer>
        {errorComponent || <ErrorMessage>{error}</ErrorMessage>}
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <Header>
        {showBackButton && (
          <HeaderTop>
            <IconButton onClick={() => navigate(backButtonPath)}>
              <ArrowLeft size={18} />
              {backButtonText}
            </IconButton>
          </HeaderTop>
        )}
        <Heading1 style={{ margin: 0 }}>{title}</Heading1>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {headerActions && <HeaderActions>{headerActions}</HeaderActions>}
      </Header>
      <Content>{children}</Content>
    </ContentContainer>
  );
};
