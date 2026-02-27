import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

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
  /** Optional className for the outer wrapper */
  className?: string;
}

/**
 * PageLayout - Consistent layout template for all application pages
 *
 * Provides:
 * - Consistent container wrapper (max-w-6xl, centred, responsive padding)
 * - Optional back button with customisable destination
 * - Page title (H1)
 * - Optional header actions area (filters, buttons, etc.)
 * - Loading and error states
 * - Responsive behaviour
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
  className,
}: PageLayoutProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={cn('mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]', className)}>
        {loadingComponent || (
          <p className="text-center py-10 text-muted-foreground text-base">Loading...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]', className)}>
        {errorComponent || (
          <p className="text-center py-10 text-destructive text-base">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]', className)}>
      <header className="mb-[30px]">
        {showBackButton && (
          <div className="flex items-center gap-[15px] mb-[10px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(backButtonPath)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              {backButtonText}
            </Button>
          </div>
        )}
        <h1 className="text-[32px] font-bold text-foreground m-0">{title}</h1>
        {subtitle && (
          <p className="text-base text-muted-foreground mt-2 mb-0">{subtitle}</p>
        )}
        {headerActions && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">{headerActions}</div>
        )}
      </header>
      <div>{children}</div>
    </div>
  );
};
