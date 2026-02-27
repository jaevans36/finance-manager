import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-theme.css';
import { cn } from '../../lib/utils';

type CalendarProps = React.ComponentProps<typeof Calendar>;

export const StyledCalendar = ({ className, ...props }: CalendarProps) => (
  <Calendar {...props} className={cn('finance-calendar', className)} />
);

/* ── Badge helper components ─────────────────────────── */

const getPriorityBg = (priority: string): string => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'bg-destructive';
    case 'Medium':
      return 'bg-muted-foreground';
    default:
      return 'bg-border';
  }
};

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'text-[#1A1A1A]';
    case 'Medium':
      return 'text-primary-foreground';
    default:
      return 'text-foreground';
  }
};

interface TaskBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  priority: string;
  children: React.ReactNode;
}

export const TaskBadge = ({ priority, className, children, ...props }: TaskBadgeProps) => (
  <div
    className={cn(
      'mt-1 flex h-5 min-w-[24px] cursor-pointer items-center justify-center rounded-md px-1.5 text-[11px] font-semibold transition-transform hover:scale-110',
      getPriorityBg(priority),
      getPriorityText(priority),
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

interface EventBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  children: React.ReactNode;
}

export const EventBadge = ({ color, className, style, children, ...props }: EventBadgeProps) => (
  <div
    className={cn(
      'mt-1 flex h-5 min-w-[24px] cursor-pointer items-center justify-center rounded-md px-1.5 text-[11px] font-semibold text-[#1A1A1A] transition-transform hover:scale-110',
      !color && 'bg-border',
      className,
    )}
    style={color ? { backgroundColor: color, ...style } : style}
    {...props}
  >
    {children}
  </div>
);

export const BadgeContainer = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex w-full flex-col items-center gap-0.5', className)}
    {...props}
  >
    {children}
  </div>
);
