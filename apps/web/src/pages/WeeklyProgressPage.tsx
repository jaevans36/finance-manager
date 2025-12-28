import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { statisticsService } from '../../services/statisticsService';
import { useToast } from '../../contexts/ToastContext';
import type { WeeklyStatistics, UrgentTask } from '../../types/statistics';
import { BarChartWrapper } from '../../components/charts/BarChartWrapper';
import { PieChartWrapper } from '../../components/charts/PieChartWrapper';
import { chartColors } from '../../components/charts/chartTheme';
import { Card, Button, Text, Badge } from '../../components/ui';

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 10px 0;
  font-size: 28px;
`;

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
  font-size: 16px;
  font-weight: 500;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Card)`
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin: 10px 0;
`;

const StatLabel = styled(Text)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(Card)`
  padding: 20px;
`;

const ChartTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 15px 0;
  font-size: 18px;
`;

const UrgentSection = styled.div`
  margin-top: 30px;
`;

const UrgentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const UrgentTaskCard = styled(Card)<{ $priority: string }>`
  padding: 15px;
  border-left: 4px solid ${({ $priority }) => 
    $priority === 'Critical' ? chartColors.critical :
    $priority === 'High' ? chartColors.high :
    chartColors.medium
  };
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskTitle = styled(Text)`
  font-weight: 500;
  font-size: 16px;
`;

const DaysRemaining = styled.span<{ $urgent: boolean }>`
  color: ${({ $urgent }) => $urgent ? chartColors.urgent : chartColors.textLight};
  font-size: 14px;
  font-weight: 500;
`;

const LoadingSkeleton = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 8px;
  padding: 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeeklyProgressPage: React.FC = () => {
  const [stats, setStats] = useState<WeeklyStatistics | null>(null);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const weekStartStr = currentWeekStart.toISOString();
      const [weeklyStats, urgent] = await Promise.all([
        statisticsService.getWeeklyStatistics(weekStartStr),
        statisticsService.getUrgentTasks(weekStartStr),
      ]);
      setStats(weeklyStats);
      setUrgentTasks(urgent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load statistics';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(getWeekStart(newDate));
  };

  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (loading || !stats) {
    return (
      <PageContainer>
        <LoadingSkeleton>Loading statistics...</LoadingSkeleton>
      </PageContainer>
    );
  }

  // Prepare chart data
  const dailyChartData = stats.dailyBreakdown.map(day => ({
    name: new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    Completed: day.completedTasks,
    Incomplete: day.totalTasks - day.completedTasks,
  }));

  const completionPieData = [
    { name: 'Completed', value: stats.completedTasks, color: chartColors.primary },
    { name: 'Incomplete', value: stats.totalTasks - stats.completedTasks, color: chartColors.secondary },
  ];

  return (
    <PageContainer>
      <Header>
        <Title>Weekly Progress Dashboard</Title>
        <WeekNavigation>
          <Button variant="outline" size="small" onClick={() => navigateWeek('prev')}>
            ← Previous
          </Button>
          <WeekDisplay>{formatWeekRange(currentWeekStart)}</WeekDisplay>
          <Button variant="outline" size="small" onClick={() => navigateWeek('next')}>
            Next →
          </Button>
          <Button variant="outline" size="small" onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}>
            Today
          </Button>
        </WeekNavigation>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Tasks</StatLabel>
          <StatValue>{stats.totalTasks}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Completed</StatLabel>
          <StatValue style={{ color: chartColors.primary }}>{stats.completedTasks}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Completion Rate</StatLabel>
          <StatValue>{stats.completionPercentage.toFixed(1)}%</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Remaining</StatLabel>
          <StatValue style={{ color: chartColors.secondary }}>
            {stats.totalTasks - stats.completedTasks}
          </StatValue>
        </StatCard>
      </StatsGrid>

      <ChartsSection>
        <ChartCard>
          <ChartTitle>Daily Task Overview</ChartTitle>
          <BarChartWrapper 
            data={dailyChartData}
            dataKeys={[
              { key: 'Completed', color: chartColors.primary, name: 'Completed' },
              { key: 'Incomplete', color: chartColors.secondary, name: 'Incomplete' },
            ]}
            height={300}
          />
        </ChartCard>
        <ChartCard>
          <ChartTitle>Weekly Completion</ChartTitle>
          <PieChartWrapper data={completionPieData} height={300} />
        </ChartCard>
      </ChartsSection>

      {urgentTasks.length > 0 && (
        <UrgentSection>
          <ChartTitle>Urgent Tasks This Week</ChartTitle>
          <UrgentList>
            {urgentTasks.map(task => (
              <UrgentTaskCard key={task.id} $priority={task.priority}>
                <TaskHeader>
                  <TaskTitle>{task.title}</TaskTitle>
                  <Badge variant={
                    task.priority === 'Critical' ? 'danger' : 
                    task.priority === 'High' ? 'warning' : 'primary'
                  }>
                    {task.priority}
                  </Badge>
                </TaskHeader>
                {task.description && <Text>{task.description}</Text>}
                {task.daysUntilDue !== undefined && (
                  <DaysRemaining $urgent={task.daysUntilDue <= 2}>
                    {task.daysUntilDue === 0 ? 'Due today' :
                     task.daysUntilDue === 1 ? 'Due tomorrow' :
                     `Due in ${task.daysUntilDue} days`}
                  </DaysRemaining>
                )}
              </UrgentTaskCard>
            ))}
          </UrgentList>
        </UrgentSection>
      )}
    </PageContainer>
  );
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.setDate(diff));
}

export default WeeklyProgressPage;
