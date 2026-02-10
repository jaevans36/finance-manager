import styled from 'styled-components';
import { Button, Text } from '@finance-manager/ui';
import { mediaQueries } from '@finance-manager/ui/styles';

const WeekNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  ${mediaQueries.tablet} {
    flex-wrap: wrap;
  }
`;

const WeekDisplay = styled(Text)`
  margin: 0;
  font-weight: 500;
`;

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
    <WeekNavigation>
      <Button variant="outline" size="small" onClick={() => onNavigate('prev')}>
        ← Previous
      </Button>
      <WeekDisplay>{formatDateRange(currentStartDate)}</WeekDisplay>
      <Button variant="outline" size="small" onClick={() => onNavigate('next')}>
        Next →
      </Button>
      <Button variant="outline" size="small" onClick={onToday}>
        {todayLabel}
      </Button>
    </WeekNavigation>
  );
};
