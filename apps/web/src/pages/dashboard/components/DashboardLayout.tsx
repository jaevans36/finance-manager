import { cn } from '../../../lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout = ({ children, className }: DashboardLayoutProps) => (
  <div
    className={cn(
      'grid grid-cols-[280px_1fr] items-start gap-6 md:grid-cols-1 md:gap-4',
      className,
    )}
  >
    {children}
  </div>
);
