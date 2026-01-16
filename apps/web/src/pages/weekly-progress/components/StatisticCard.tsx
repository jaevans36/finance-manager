import styled from 'styled-components';
import { Card, Text } from '../../../components/ui';
import { chartColors } from '../../../components/charts/chartTheme';

const StatCard = styled(Card)`
  padding: 20px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
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

  &:hover {
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: 42px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin: 10px 0;
  transition: all 0.3s ease;
  animation: scaleIn 0.6s ease-out;

  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const StatLabel = styled(Text)`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.5px;
`;

const TrendIndicator = styled(Text)<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 500;
  margin-top: 8px;
  color: ${({ $trend, theme }) =>
    $trend === 'up' ? chartColors.primary :
    $trend === 'down' ? chartColors.urgent :
    theme.colors.textSecondary
  };
`;

interface StatisticCardProps {
  label: string;
  value: number | string;
  valueColor?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export const StatisticCard = ({ 
  label, 
  value, 
  valueColor,
  trend 
}: StatisticCardProps) => {
  return (
    <StatCard>
      <StatLabel>{label}</StatLabel>
      <StatValue style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </StatValue>
      {trend && (
        <TrendIndicator $trend={trend.direction}>
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
          {trend.value}
        </TrendIndicator>
      )}
    </StatCard>
  );
};
