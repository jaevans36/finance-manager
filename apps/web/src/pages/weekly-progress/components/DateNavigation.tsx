import { Button } from '../../../components/ui/button';

interface DateNavigationProps {
  currentStartDate: Date;
  viewMode: 'week' | 'month' | 'custom';
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  formatDateRange: (date: Date) => string;
}

export const DateNavigation = ({
  currentStartDate,
  viewMode,
  onNavigate,
  onToday,
  formatDateRange,
}: DateNavigationProps) => {
  const todayLabel = viewMode === 'month' ? 'This Month' : 'Today';

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="secondary" size="sm" onClick={() => onNavigate('prev')}>
        ← Previous
      </Button>
      <p className="m-0 font-medium text-sm text-foreground">{formatDateRange(currentStartDate)}</p>
      <Button variant="secondary" size="sm" onClick={() => onNavigate('next')}>
        Next →
      </Button>
      <Button variant="secondary" size="sm" onClick={onToday}>
        {todayLabel}
      </Button>
    </div>
  );
};
