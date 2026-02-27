import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../../lib/utils';
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

const getCssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

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
    } catch (err: unknown) {
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
    completionRate: Math.round(stat.completionRate * 10) / 10,
    totalTasks: stat.totalTasks,
    completedTasks: stat.completedTasks,
  }));

  return (
    <div className={cn('rounded-lg bg-card p-6 mb-6', className)}>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h2 className="m-0 text-xl font-semibold text-foreground">Completion Rate History</h2>
        <div className="flex gap-2">
          {([4, 8, 12] as const).map((w) => (
            <button
              key={w}
              className={cn(
                'px-3 py-1.5 border rounded text-sm cursor-pointer transition-all',
                weeks === w
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-secondary'
              )}
              onClick={() => setWeeks(w)}
            >
              {w} Weeks
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-[300px] text-muted-foreground">
          Loading historical data...
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col justify-center items-center h-[300px] gap-3">
          <p className="text-destructive m-0">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground border-none rounded text-sm cursor-pointer hover:bg-primary/90"
            onClick={fetchData}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="flex justify-center items-center h-[300px] text-muted-foreground">
          No historical data available
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <LineChartWrapper
          data={chartData}
          xAxisKey="week"
          yAxisLabel="Completion Rate (%)"
          lines={[
            {
              dataKey: 'completionRate',
              stroke: `hsl(${getCssVar('--success')})`,
              name: 'Completion Rate %',
            },
          ]}
        />
      )}
    </div>
  );
};
