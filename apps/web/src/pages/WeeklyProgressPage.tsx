import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { statisticsService } from '../services/statisticsService';
import { taskService } from '../services/taskService';
import { useToast } from '../contexts/ToastContext';
import type { WeeklyStatistics, UrgentTask } from '../types/statistics';
import { BarChartWrapper } from '../components/charts/BarChartWrapper';
import { PieChartWrapper } from '../components/charts/PieChartWrapper';
import { chartColors } from '../components/charts/chartTheme';
import { Card, Button, Text } from '../components/ui';

const PageContainer = styled.div`
  max-width: 1200px;
  width: 80%;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
    width: 95%;
  }
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: ${({ theme }) => theme.colors.cardBackground};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
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

const PriorityBadge = styled.span<{ $priority: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ $priority }) => 
    $priority === 'Critical' ? chartColors.critical :
    $priority === 'High' ? chartColors.high :
    chartColors.medium
  };
  color: white;
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const UrgentTaskTitle = styled(Text)`
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

const DailyBreakdownSection = styled.div`
  margin-top: 30px;
`;

const DailyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DayCard = styled(Card)`
  padding: 18px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
`;

const DayHeader = styled.div`
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 10px;
  margin-bottom: 12px;
`;

const DayName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const DayDate = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const DayStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 4px;
`;

const CompletionBadge = styled.span<{ $rate: number }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $rate }) => $rate >= 75 ? chartColors.primary : $rate >= 50 ? chartColors.warning : chartColors.urgent};
`;

const TaskList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const TaskItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: ${({ theme, $completed }) => 
    $completed ? theme.colors.backgroundSecondary : theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateX(2px);
  }
`;

const TaskCheckbox = styled.input`
  margin-top: 2px;
  cursor: pointer;
`;

const TaskContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskTitle = styled.div<{ $completed: boolean }>`
  font-weight: 500;
  color: ${({ theme, $completed }) => $completed ? theme.colors.textSecondary : theme.colors.text};
  text-decoration: ${({ $completed }) => $completed ? 'line-through' : 'none'};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  cursor: help;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const TaskPriority = styled.span<{ $priority: string }>`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  background-color: ${({ $priority }) => 
    $priority === 'Critical' ? chartColors.critical :
    $priority === 'High' ? chartColors.high :
    $priority === 'Medium' ? chartColors.medium :
    chartColors.low
  };
  color: white;
`;

const TaskGroup = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyDay = styled.div`
  text-align: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
`;

const WeeklyProgressPage: React.FC = () => {
  const [stats, setStats] = useState<WeeklyStatistics | null>(null);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
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
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, showToast]);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await taskService.toggleTask(taskId, !currentCompleted);
      // Reload data to get updated statistics
      await loadData();
      showToast('success', `Task ${!currentCompleted ? 'completed' : 'reopened'}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      showToast('error', message);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const dailyChartData = stats.dailyBreakdown.map((day) => ({
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
        <HeaderTop>
          <BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </BackButton>
        </HeaderTop>
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

      <DailyBreakdownSection>
        <ChartTitle>Daily Task Breakdown</ChartTitle>
        <DailyGrid>
          {stats.dailyBreakdown.map((day) => {
            const dayDate = new Date(day.date);
            const dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
            const dayNumber = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const dayTasks = day.tasks || [];
            
            return (
              <DayCard key={day.date}>
                <DayHeader>
                  <DayName>{dayName}</DayName>
                  <DayDate>{dayNumber}</DayDate>
                  <DayStats>
                    <Text style={{ fontSize: '12px' }}>
                      {day.completedTasks}/{day.totalTasks}
                    </Text>
                    <CompletionBadge $rate={day.completionRate}>
                      {day.completionRate.toFixed(0)}%
                    </CompletionBadge>
                  </DayStats>
                </DayHeader>
                
                {dayTasks.length > 0 ? (
                  <TaskList>
                    {dayTasks.map((task) => (
                      <TaskItem key={task.id} $completed={task.completed}>
                        <TaskCheckbox 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id, task.completed)}
                        />
                        <TaskContent>
                          <TaskTitle $completed={task.completed} title={task.title}>
                            {task.title}
                          </TaskTitle>
                          <TaskMeta>
                            <TaskPriority $priority={task.priority}>
                              {task.priority}
                            </TaskPriority>
                            {task.groupName && (
                              <TaskGroup>{task.groupName}</TaskGroup>
                            )}
                          </TaskMeta>
                        </TaskContent>
                      </TaskItem>
                    ))}
                  </TaskList>
                ) : (
                  <EmptyDay>No tasks</EmptyDay>
                )}
              </DayCard>
            );
          })}
        </DailyGrid>
      </DailyBreakdownSection>

      {urgentTasks && urgentTasks.length > 0 && (
        <UrgentSection>
          <ChartTitle>Urgent Tasks This Week</ChartTitle>
          <UrgentList>
            {urgentTasks.map(task => (
              <UrgentTaskCard key={task.id} $priority={task.priority}>
                <TaskHeader>
                  <UrgentTaskTitle>{task.title}</UrgentTaskTitle>
                  <PriorityBadge $priority={task.priority}>
                    {task.priority}
                  </PriorityBadge>
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
