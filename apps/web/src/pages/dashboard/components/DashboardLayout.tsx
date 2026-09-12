import { cn } from '../../../lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout = ({ children, className }: DashboardLayoutProps) => (
  <div
    className={cn(
      // Mobile-first: single column by default, sidebar + content only once there's
      // room for it (lg: 1024px+). The previous `md:grid-cols-1` inverted this — with
      // no custom breakpoints in this project, `md:` is a min-width query, so it was
      // stacking on every normal desktop window and only using the sidebar on the
      // narrowest phones.
      'grid grid-cols-1 items-start gap-4 lg:grid-cols-[280px_1fr] lg:gap-6',
      className,
    )}
  >
    {children}
  </div>
);
