import styled from 'styled-components';
import { Button, Text } from '../../../components/ui';

const WeekNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const WeekDisplay = styled(Text)`
  font-weight: 500;
`;

interface DateNavigationProps {
  currentStartDate: Date;
  viewMode: 'week' | 'month' | 'custom';
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  formatDateRange: (date: Date) => string;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentStartDate,
  viewMode,
  onNavigate,
  onToday,
  formatDateRange,
}) => {
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
