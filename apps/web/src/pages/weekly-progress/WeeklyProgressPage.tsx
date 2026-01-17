import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { statisticsService } from '../../services/statisticsService';
import { taskService, type Task } from '../../services/taskService';
import { taskGroupService } from '../../services/taskGroupService';
import { useToast } from '../../contexts/ToastContext';
import type { WeeklyStatistics, UrgentTask } from '../../types/statistics';
import type { TaskGroup } from '../../types/taskGroup';
import { BarChartWrapper } from '../../components/charts/BarChartWrapper';
import { PieChartWrapper } from '../../components/charts/PieChartWrapper';
import { chartColors } from '../../components/charts/chartTheme';
import { 
  ContentContainer,
  IconButton,
  ResponsiveGrid,
  TwoColumnGrid,
  ResponsiveDailyGrid,
  InputField,
  SmallButton,
  Heading1,
  Heading3,
  Text,
  TextSecondary,
  SmallBadge,
  Card
} from '../../components/ui';
import {
  ChartCard,
  ErrorDisplay,
  StatisticCard,
  ViewModeSelector,
  DateNavigation,
  GroupFilter,
  WeeklyGoalCard,
  DailyTaskCard,
} from './components';
import { HistoricalCompletionChart } from './components/HistoricalCompletionChart';

// Helper function to get border color for priority cards
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Critical': return chartColors.critical;
    case 'High': return chartColors.high;
    default: return chartColors.medium;
  }
};

const Header = styled.div`
  margin-bottom: 30px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
`;

const WeekNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const NavigationLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
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

const CustomDateSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterContainer = styled.div`
  margin-bottom: 25px;
`;

const ApplyButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DailyBreakdownSection = styled.div`
  margin-top: 30px;
`;

const InsightsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
`;

const UrgentSection = styled.div`
  margin-top: 30px;
`;

const GoalAndInsightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }

  > * {
    min-height: 180px;
  }
`;

const InsightIcon = styled.div`
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
  }
`;

const InsightValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 8px;
`;

const InsightLabel = styled(TextSecondary)`
  display: block;
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

const UrgentTaskTitle = styled(Text)`
  font-weight: 500;
`;

const DaysRemaining = styled(Text)<{ $urgent: boolean }>`
  color: ${({ $urgent }) => $urgent ? chartColors.urgent : chartColors.textLight};
  font-weight: 500;
`;


const WeeklyProgressPage = () => {
  const [stats, setStats] = useState<WeeklyStatistics | null>(null);
  const [prevWeekStats, setPrevWeekStats] = useState<WeeklyStatistics | null>(null);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('weeklyTaskGoal');
    return saved ? parseInt(saved, 10) : 10;
  });
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Handle view mode changes - reset to appropriate starting position
  const handleViewModeChange = (newMode: 'week' | 'month' | 'custom') => {
    setViewMode(newMode);
    
    if (newMode === 'week') {
      // Reset to current week (Monday of this week)
      setCurrentWeekStart(getWeekStart(new Date()));
    } else if (newMode === 'month') {
      // Reset to current month (1st of this month)
      setCurrentWeekStart(getMonthStart(new Date()));
    } else if (newMode === 'custom') {
      // Initialize custom dates to current month range
      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
      
      setCustomStartDate(monthStart.toISOString().split('T')[0]);
      setCustomEndDate(monthEnd.toISOString().split('T')[0]);
      setCurrentWeekStart(monthStart);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const weekStartStr = currentWeekStart.toISOString();
      
      // Calculate previous week start
      const prevWeek = new Date(currentWeekStart);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevWeekStartStr = prevWeek.toISOString();
      
      const [weeklyStats, urgent, previousWeekStats] = await Promise.all([
        statisticsService.getWeeklyStatistics(weekStartStr),
        statisticsService.getUrgentTasks(weekStartStr),
        statisticsService.getWeeklyStatistics(prevWeekStartStr).catch(() => null), // Optional: previous week for comparison
      ]);

      setStats(weeklyStats);
      setUrgentTasks(urgent);
      setPrevWeekStats(previousWeekStats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load statistics';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, showToast]);

  // Background refresh without showing loading state
  const refreshDataInBackground = useCallback(async () => {
    try {
      const weekStartStr = currentWeekStart.toISOString();
      
      // Calculate previous week start
      const prevWeek = new Date(currentWeekStart);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevWeekStartStr = prevWeek.toISOString();
      
      const [weeklyStats, urgent, previousWeekStats] = await Promise.all([
        statisticsService.getWeeklyStatistics(weekStartStr),
        statisticsService.getUrgentTasks(weekStartStr),
        statisticsService.getWeeklyStatistics(prevWeekStartStr).catch(() => null),
      ]);

      setStats(weeklyStats);
      setUrgentTasks(urgent);
      setPrevWeekStats(previousWeekStats);
    } catch (error: unknown) {
      // Silently fail on background refresh, don't show error to user
      console.error('Background refresh failed:', error);
    }
  }, [currentWeekStart]);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      // Optimistically update the UI
      if (stats) {
        const updatedStats = { ...stats };
        updatedStats.dailyBreakdown = updatedStats.dailyBreakdown.map(day => ({
          ...day,
          tasks: day.tasks?.map(task => 
            task.id === taskId ? { ...task, completed: !currentCompleted } : task
          ),
        }));
        setStats(updatedStats);
      }

      // Update on server
      await taskService.toggleTask(taskId, !currentCompleted);
      
      // Refresh data in background without loading state
      await refreshDataInBackground();
      showToast('success', `Task ${!currentCompleted ? 'completed' : 'reopened'}`);
    } catch (error: unknown) {
      // Revert optimistic update on error
      await refreshDataInBackground();
      const message = error instanceof Error ? error.message : 'Failed to update task';
      showToast('error', message);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time refresh: poll for updates every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshDataInBackground();
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, [refreshDataInBackground]);

  // Load task groups on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const fetchedGroups = await taskGroupService.getGroups();
        setGroups(fetchedGroups);
      } catch (error: unknown) {
        console.error('Failed to load groups:', error);
      }
    };
    loadGroups();
  }, []);

  // Update goal in localStorage
  const updateWeeklyGoal = (newGoal: number) => {
    if (newGoal > 0 && newGoal <= 1000) {
      setWeeklyGoal(newGoal);
      localStorage.setItem('weeklyTaskGoal', newGoal.toString());
      showToast('success', `Weekly goal updated to ${newGoal} tasks`);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(getWeekStart(newDate));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentWeekStart(getMonthStart(newDate));
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      setCurrentWeekStart(startDate);
      loadData();
    }
  };

  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const formatMonthRange = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Chart export functionality
  const exportChartAsImage = async (chartId: string, filename: string) => {
    try {
      const chartElement = document.getElementById(chartId);
      if (!chartElement) {
        showToast('error', 'Chart element not found');
        return;
      }

      // Use html2canvas to capture the chart
      const canvas = await import('html2canvas').then(m => m.default(chartElement));
      const dataUrl = canvas.toDataURL('image/png');
      
      // Download the image
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      showToast('success', 'Chart exported successfully');
    } catch (error: unknown) {
      console.error('Export failed:', error);
      showToast('error', 'Failed to export chart');
    }
  };

  if (loading || !stats) {
    return (
      <ContentContainer>
        <LoadingSkeleton>Loading statistics...</LoadingSkeleton>
      </ContentContainer>
    );
  }

  if (error) {
    return (
      <ContentContainer>
        <Header>
          <HeaderTop>
            <IconButton onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={18} />
              Back to Dashboard
            </IconButton>
          </HeaderTop>
          <Heading1 style={{ margin: 0 }}>Weekly Progress Dashboard</Heading1>
        </Header>
        <ErrorDisplay 
          message={error}
          onRetry={() => loadData()}
          title="Failed to Load Statistics"
        />
      </ContentContainer>
    );
  }

  // Calculate trends compared to previous week
  const calculateTrend = (current: number, previous: number | undefined): { trend: 'up' | 'down' | 'neutral', change: number } => {
    if (!previous || previous === 0) return { trend: 'neutral', change: 0 };
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 1) return { trend: 'neutral', change: 0 };
    return { trend: change > 0 ? 'up' : 'down', change: Math.abs(change) };
  };

  const completionTrend = prevWeekStats ? calculateTrend(stats.completionPercentage, prevWeekStats.completionPercentage) : { trend: 'neutral' as const, change: 0 };
  const completedTasksTrend = prevWeekStats ? calculateTrend(stats.completedTasks, prevWeekStats.completedTasks) : { trend: 'neutral' as const, change: 0 };

  // Calculate productivity insights
  const calculateStreak = (): number => {
    let streak = 0;
    const sortedDays = [...stats.dailyBreakdown].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const day of sortedDays) {
      if (day.completedTasks > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const findBestDay = (): { day: string, count: number } | null => {
    if (stats.dailyBreakdown.length === 0) return null;
    
    const best = stats.dailyBreakdown.reduce((max, day) => 
      day.completedTasks > max.completedTasks ? day : max
    , stats.dailyBreakdown[0]);
    
    return {
      day: new Date(best.date).toLocaleDateString('en-GB', { weekday: 'long' }),
      count: best.completedTasks
    };
  };

  const streak = calculateStreak();
  const bestDay = findBestDay();

  // Filter tasks by selected group if applicable
  const filterTasksByGroup = (tasks: Task[]): Task[] => {
    if (!selectedGroupId) return tasks;
    return tasks.filter((task) => task.groupId === selectedGroupId);
  };

  // Filter daily breakdown and urgent tasks
  const filteredDailyBreakdown = stats.dailyBreakdown.map(day => ({
    ...day,
    tasks: day.tasks ? filterTasksByGroup(day.tasks) : [],
  }));

  const filteredUrgentTasks = selectedGroupId 
    ? urgentTasks.filter(task => task.groupId === selectedGroupId)
    : urgentTasks;

  // Get unscheduled tasks (tasks without due dates)
  const getUnscheduledTasks = (): Task[] => {
    const allTasks = stats.dailyBreakdown.flatMap(day => day.tasks || []);
    const unscheduled = allTasks.filter((task) => !task.dueDate);
    return selectedGroupId 
      ? unscheduled.filter((task) => task.groupId === selectedGroupId)
      : unscheduled;
  };

  const unscheduledTasks = getUnscheduledTasks();

  // Prepare chart data
  const dailyChartData = filteredDailyBreakdown.map((day) => ({
    name: new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    Completed: day.completedTasks,
    Incomplete: day.totalTasks - day.completedTasks,
  }));

  const completionPieData = [
    { name: 'Completed', value: stats.completedTasks, color: chartColors.primary },
    { name: 'Incomplete', value: stats.totalTasks - stats.completedTasks, color: chartColors.secondary },
  ];

  return (
    <ContentContainer>
      <Header>
        <HeaderTop>
          <IconButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </IconButton>
        </HeaderTop>
        <Heading1 style={{ margin: 0 }}>Weekly Progress Dashboard</Heading1>
        <WeekNavigation>
          <NavigationLeft>
            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={handleViewModeChange}
            />

            {viewMode === 'week' && (
              <DateNavigation
                currentStartDate={currentWeekStart}
                viewMode={viewMode}
                onNavigate={navigateWeek}
                onToday={() => setCurrentWeekStart(getWeekStart(new Date()))}
                formatDateRange={formatWeekRange}
              />
            )}

            {viewMode === 'month' && (
              <DateNavigation
                currentStartDate={currentWeekStart}
                viewMode={viewMode}
                onNavigate={navigateMonth}
                onToday={() => setCurrentWeekStart(getMonthStart(new Date()))}
                formatDateRange={formatMonthRange}
              />
            )}

            {viewMode === 'custom' && (
              <CustomDateSelector>
                <InputField
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <Text>to</Text>
                <InputField
                  type="date"
                  value={customEndDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
                  placeholder="End date"
                />
                <ApplyButton 
                  onClick={applyCustomDateRange}
                  disabled={!customStartDate || !customEndDate}
                >
                  Apply
                </ApplyButton>
              </CustomDateSelector>
            )}
          </NavigationLeft>
        </WeekNavigation>
      </Header>

      {/* Group Filter Section */}
      {groups.length > 0 && (
        <FilterContainer>
          <GroupFilter
            groups={groups.map(g => g.name)}
            selectedGroup={selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name || null : null}
            onGroupChange={(groupName) => {
              if (groupName === null) {
                setSelectedGroupId(null);
              } else {
                const group = groups.find(g => g.name === groupName);
                setSelectedGroupId(group?.id || null);
              }
            }}
          />
        </FilterContainer>
      )}

      {/* Weekly Goal and Most Productive Day */}
      <GoalAndInsightGrid>
        <WeeklyGoalCard
          completedTasks={stats.completedTasks}
          weeklyGoal={weeklyGoal}
          onUpdateGoal={updateWeeklyGoal}
        />

        {bestDay && bestDay.count > 0 && (
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
            <InsightIcon>
              <Award />
            </InsightIcon>
            <InsightValue>{bestDay.day}</InsightValue>
            <InsightLabel>Most Productive Day</InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              {bestDay.count} {bestDay.count === 1 ? 'task' : 'tasks'} completed
            </Text>
          </Card>
        )}
      </GoalAndInsightGrid>

      <ResponsiveGrid minWidth="200px" gap={20} style={{ marginBottom: '30px' }}>
        <StatisticCard
          label="Total Tasks"
          value={stats.totalTasks}
          trend={prevWeekStats && prevWeekStats.totalTasks > 0 ? {
            direction: stats.totalTasks > prevWeekStats.totalTasks ? 'up' : stats.totalTasks < prevWeekStats.totalTasks ? 'down' : 'neutral',
            value: `${Math.abs(stats.totalTasks - prevWeekStats.totalTasks)} vs last week`
          } : undefined}
        />
        <StatisticCard
          label="Completed"
          value={stats.completedTasks}
          valueColor={chartColors.primary}
          trend={prevWeekStats && completedTasksTrend.change > 0 ? {
            direction: completedTasksTrend.trend,
            value: `${completedTasksTrend.change.toFixed(0)}% vs last week`
          } : undefined}
        />
        <StatisticCard
          label="Completion Rate"
          value={`${stats.completionPercentage.toFixed(1)}%`}
          trend={prevWeekStats && completionTrend.change > 0 ? {
            direction: completionTrend.trend,
            value: `${completionTrend.change.toFixed(1)}% vs last week`
          } : undefined}
        />
        <StatisticCard
          label="Remaining"
          value={stats.totalTasks - stats.completedTasks}
          valueColor={chartColors.secondary}
        />
      </ResponsiveGrid>

      <TwoColumnGrid gap={20} style={{ marginBottom: '30px' }}>
        <ChartCard 
          title="Daily Task Overview"
          headerAction={
            <SmallButton onClick={() => exportChartAsImage('daily-chart', 'daily-task-overview')}>
              📥 Export
            </SmallButton>
          }
        >
          <div id="daily-chart">
            <BarChartWrapper 
              data={dailyChartData}
              dataKeys={[
                { key: 'Completed', color: chartColors.primary, name: 'Completed Tasks' },
                { key: 'Incomplete', color: chartColors.secondary, name: 'Incomplete Tasks' },
              ]}
              height={300}
              title="Daily Task Overview"
              description="Bar chart showing completed and incomplete tasks for each day of the week"
            />
          </div>
        </ChartCard>
        <ChartCard 
          title="Weekly Completion"
          headerAction={
            <SmallButton onClick={() => exportChartAsImage('weekly-pie-chart', 'weekly-completion')}>
              📥 Export
            </SmallButton>
          }
        >
          <div id="weekly-pie-chart">
            <PieChartWrapper 
              data={completionPieData} 
              height={300}
              title="Weekly Completion Rate"
              description={`Pie chart showing ${stats.completedTasks} completed out of ${stats.totalTasks} total tasks this week`}
            />
          </div>
        </ChartCard>
      </TwoColumnGrid>

      {/* Productivity Insights */}
      <InsightsSection>
        {streak > 0 && (
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
            <InsightIcon>🔥</InsightIcon>
            <InsightValue>{streak}</InsightValue>
            <InsightLabel>
              {streak === 1 ? 'Day Streak' : 'Days Streak'}
            </InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              Consecutive days with completed tasks
            </Text>
          </Card>
        )}

        {stats.completionPercentage >= 80 && (
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
            <InsightIcon>🏆</InsightIcon>
            <InsightValue>Excellent!</InsightValue>
            <InsightLabel>High Achiever</InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              {stats.completionPercentage.toFixed(0)}% completion rate this week
            </Text>
          </Card>
        )}
      </InsightsSection>

      {/* Historical Completion Rate Chart */}
      <HistoricalCompletionChart />

      <DailyBreakdownSection>
        <Heading3 style={{ margin: '0 0 15px 0' }}>Daily Task Breakdown</Heading3>
        <ResponsiveDailyGrid gap={20} style={{ marginTop: '20px' }}>
          {filteredDailyBreakdown.map((day) => (
            <DailyTaskCard
              key={day.date}
              date={day.date}
              totalTasks={day.totalTasks}
              completedTasks={day.completedTasks}
              completionRate={day.completionRate}
              tasks={day.tasks || []}
              onToggleTask={handleToggleTask}
            />
          ))}
        </ResponsiveDailyGrid>
      </DailyBreakdownSection>

      {urgentTasks && filteredUrgentTasks.length > 0 && (
        <UrgentSection>
          <Heading3 style={{ margin: '0 0 15px 0' }}>Urgent Tasks This Week</Heading3>
          <UrgentList>
            {filteredUrgentTasks.map(task => (
              <UrgentTaskCard key={task.id} $priority={task.priority}>
                <TaskHeader>
                  <UrgentTaskTitle>{task.title}</UrgentTaskTitle>
                  <SmallBadge style={{ backgroundColor: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </SmallBadge>
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

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <UrgentSection>
          <Heading3 style={{ margin: '0 0 15px 0' }}>Unscheduled Tasks</Heading3>
          <Text style={{ marginBottom: '15px', color: 'inherit' }}>
            Tasks without due dates ({unscheduledTasks.length})
          </Text>
          <UrgentList>
            {unscheduledTasks.slice(0, 10).map((task: Task) => (
              <UrgentTaskCard key={task.id} $priority={task.priority || 'Low'}>
                <TaskHeader>
                  <UrgentTaskTitle>{task.title}</UrgentTaskTitle>
                  <SmallBadge style={{ backgroundColor: getPriorityColor(task.priority || 'Low') }}>
                    {task.priority || 'Low'}
                  </SmallBadge>
                </TaskHeader>
                {task.description && <Text>{task.description}</Text>}
                {task.groupName && (
                  <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
                    📁 {task.groupName}
                  </Text>
                )}
              </UrgentTaskCard>
            ))}
          </UrgentList>
          {unscheduledTasks.length > 10 && (
            <Text style={{ marginTop: '15px', textAlign: 'center', color: 'inherit' }}>
              +{unscheduledTasks.length - 10} more unscheduled tasks
            </Text>
          )}
        </UrgentSection>
      )}
    </ContentContainer>
  );
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.setDate(diff));
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default WeeklyProgressPage;
