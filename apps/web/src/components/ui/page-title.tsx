import { cn } from '../../lib/utils';

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTitle — Display-weight heading for page-level titles.
 * Uses the DM Sans display font at 32px (display-lg).
 */
export const PageTitle = ({ children, className }: PageTitleProps) => (
  <h1
    className={cn(
      'font-display text-display-lg tracking-tight text-foreground',
      className,
    )}
  >
    {children}
  </h1>
);

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

/**
 * SectionTitle — Display-weight heading for section/card-level titles.
 * Uses DM Sans at 18px (heading) by default.
 */
export const SectionTitle = ({
  children,
  className,
  as: Tag = 'h2',
}: SectionTitleProps) => (
  <Tag
    className={cn(
      'font-display text-heading tracking-tight text-foreground',
      className,
    )}
  >
    {children}
  </Tag>
);
