import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { statisticsService } from '../../../services/statisticsService';
import type { HistoricalStatistics } from '../../../types/statistics';
import { LineChartWrapper } from '../../../components/charts/LineChartWrapper';

// Helper function to format week label
const formatWeekLabel = (weekStart: string) => {
  const date = new Date(weekStart);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

const ChartCard = styled.div`
  background: ${(props) => props.theme.colors.cardBackground};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const WeekRangeSelector = styled.div`
  display: flex;
  gap: 8px;
`;

const RangeButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  background: ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.cardBackground};
  color: ${(props) => props.$active ? 'white' : props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.$active ? props.theme.colors.primaryHover : props.theme.colors.backgroundSecondary};
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 1rem;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  gap: 12px;
`;

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.colors.error};
  margin: 0;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    background: ${(props) => props.theme.colors.primaryHover};
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 1rem;
`;

interface HistoricalCompletionChartProps {
  className?: string;
}

export const HistoricalCompletionChart = ({ className }: HistoricalCompletionChartProps) => {
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState<HistoricalStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const historicalData = await statisticsService.getHistoricalStatistics(weeks);
      setData(historicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load historical data');
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = data.map((stat) => ({
    week: formatWeekLabel(stat.weekStart),
    completionRate: Math.round(stat.completionRate * 10) / 10, // Round to 1 decimal
    totalTasks: stat.totalTasks,
    completedTasks: stat.completedTasks,
  }));

  return (
    <ChartCard className={className}>
      <ChartHeader>
        <Title>Completion Rate History</Title>
        <WeekRangeSelector>
          <RangeButton $active={weeks === 4} onClick={() => setWeeks(4)}>
            4 Weeks
          </RangeButton>
          <RangeButton $active={weeks === 8} onClick={() => setWeeks(8)}>
            8 Weeks
          </RangeButton>
          <RangeButton $active={weeks === 12} onClick={() => setWeeks(12)}>
            12 Weeks
          </RangeButton>
        </WeekRangeSelector>
      </ChartHeader>

      {loading && <LoadingState>Loading historical data...</LoadingState>}

      {error && !loading && (
        <ErrorState>
          <ErrorMessage>{error}</ErrorMessage>
          <RetryButton onClick={fetchData}>Retry</RetryButton>
        </ErrorState>
      )}

      {!loading && !error && chartData.length === 0 && (
        <EmptyState>No historical data available</EmptyState>
      )}

      {!loading && !error && chartData.length > 0 && (
        <LineChartWrapper
          data={chartData}
          xAxisKey="week"
          yAxisLabel="Completion Rate (%)"
          lines={[
            {
              dataKey: 'completionRate',
              stroke: '#10b981',
              name: 'Completion Rate %',
            },
          ]}
        />
      )}
    </ChartCard>
  );
};
