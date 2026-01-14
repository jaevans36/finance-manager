import styled from 'styled-components';

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    font-size: 14px;
    margin-bottom: 16px;
  }
`;

interface EmptyCalendarStateProps {
  month: string;
  hasActiveFilters: boolean;
}

export const EmptyCalendarState: React.FC<EmptyCalendarStateProps> = ({ month, hasActiveFilters }) => {
  return (
    <EmptyStateContainer>
      <h3>No Tasks {hasActiveFilters ? 'Match Your Filters' : 'This Month'}</h3>
      <p>
        {hasActiveFilters
          ? 'Try adjusting your filters to see more tasks'
          : `No tasks scheduled for ${month}`}
      </p>
      <p>Click any date to create a new task</p>
    </EmptyStateContainer>
  );
};
