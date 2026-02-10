import styled from 'styled-components';
import { Card, TextSmall } from '@finance-manager/ui';

const InsightSection = styled(Card)`
  padding: 20px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.successBackground} 0%, ${({ theme }) => theme.colors.cardBackground} 100%);
  border: 1px solid ${({ theme }) => theme.colors.success}33;
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const InsightTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InsightIcon = styled.span`
  font-size: 22px;
`;

const InsightList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InsightItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const InsightBullet = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 700;
  font-size: 16px;
  margin-top: 2px;
`;

const InsightText = styled(TextSmall)`
  flex: 1;
  line-height: 1.5;
`;

const EmptyInsight = styled(TextSmall)`
  text-align: center;
  padding: 10px;
  display: block;
`;

interface InsightCardProps {
  insights: string[];
  title?: string;
  icon?: string;
  emptyMessage?: string;
}

export const InsightCard = ({
  insights,
  title = 'Productivity Insights',
  icon = '💡',
  emptyMessage = 'Complete more tasks to generate insights',
}: InsightCardProps) => {
  return (
    <InsightSection>
      <InsightTitle>
        <InsightIcon>{icon}</InsightIcon>
        {title}
      </InsightTitle>
      
      {insights.length > 0 ? (
        <InsightList>
          {insights.map((insight, index) => (
            <InsightItem key={index}>
              <InsightBullet>•</InsightBullet>
              <InsightText>{insight}</InsightText>
            </InsightItem>
          ))}
        </InsightList>
      ) : (
        <EmptyInsight>{emptyMessage}</EmptyInsight>
      )}
    </InsightSection>
  );
};
