import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { statisticsService } from '../services/statisticsService';
import { taskService, type Task } from '../services/taskService';
import { taskGroupService } from '../services/taskGroupService';
import { useToast } from '../contexts/ToastContext';
import type { WeeklyStatistics, UrgentTask } from '../types/statistics';
import type { TaskGroup } from '../types/taskGroup';
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

const ViewModeToggle = styled.div`
  display: flex;
  gap: 8px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 6px;
  padding: 4px;
`;

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.cardBackground};
  }
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
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
  position: relative;
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

const TrendIndicator = styled.div<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  color: ${({ $trend, theme }) => 
    $trend === 'up' ? chartColors.primary :
    $trend === 'down' ? chartColors.urgent :
    theme.colors.textSecondary
  };
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

const InsightLabel = styled(Text)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FilterSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterLabel = styled(Text)`
  font-weight: 500;
  font-size: 14px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
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

const InsightsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
`;

const InsightCard = styled(Card)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.cardBackground} 0%, ${({ theme }) => theme.colors.backgroundSecondary} 100%);
`;

const InsightIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

const InsightValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 8px;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px 20px;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  margin: 0 0 12px 0;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  margin: 0 0 24px 0;
  max-width: 500px;
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WeeklyProgressPage: React.FC = () => {
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
  const { showToast } = useToast();
  const navigate = useNavigate();

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

  if (loading || !stats) {
    return (
      <PageContainer>
        <LoadingSkeleton>Loading statistics...</LoadingSkeleton>
      </PageContainer>
    );
  }

  if (error) {
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
        </Header>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Failed to Load Statistics</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          <RetryButton onClick={() => loadData()}>
            Retry
          </RetryButton>
        </ErrorContainer>
      </PageContainer>
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
          {/* View Mode Toggle */}
          <ViewModeToggle>
            <ViewModeButton $active={viewMode === 'week'} onClick={() => setViewMode('week')}>
              Week
            </ViewModeButton>
            <ViewModeButton $active={viewMode === 'month'} onClick={() => setViewMode('month')}>
              Month
            </ViewModeButton>
            <ViewModeButton $active={viewMode === 'custom'} onClick={() => setViewMode('custom')}>
              Custom
            </ViewModeButton>
          </ViewModeToggle>

          {/* Navigation controls based on view mode */}
          {viewMode === 'week' && (
            <>
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
            </>
          )}

          {viewMode === 'month' && (
            <>
              <Button variant="outline" size="small" onClick={() => navigateMonth('prev')}>
                ← Previous
              </Button>
              <WeekDisplay>{formatMonthRange(currentWeekStart)}</WeekDisplay>
              <Button variant="outline" size="small" onClick={() => navigateMonth('next')}>
                Next →
              </Button>
              <Button variant="outline" size="small" onClick={() => setCurrentWeekStart(getMonthStart(new Date()))}>
                This Month
              </Button>
            </>
          )}

          {viewMode === 'custom' && (
            <DateRangeSelector>
              <DateInput
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Text>to</Text>
              <DateInput
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End date"
              />
              <Button 
                variant="outline" 
                size="small" 
                onClick={applyCustomDateRange}
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </DateRangeSelector>
          )}
        </WeekNavigation>
      </Header>

      {/* Group Filter Section */}
      {groups.length > 0 && (
        <FilterSection>
          <FilterLabel>Filter by Group:</FilterLabel>
          <FilterSelect 
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(e.target.value || null)}
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </FilterSelect>
          {selectedGroupId && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => setSelectedGroupId(null)}
            >
              Clear Filter
            </Button>
          )}
        </FilterSection>
      )}

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Tasks</StatLabel>
          <StatValue>{stats.totalTasks}</StatValue>
          {prevWeekStats && prevWeekStats.totalTasks > 0 && (
            <TrendIndicator $trend={stats.totalTasks > prevWeekStats.totalTasks ? 'up' : stats.totalTasks < prevWeekStats.totalTasks ? 'down' : 'neutral'}>
              {stats.totalTasks > prevWeekStats.totalTasks ? '↑' : stats.totalTasks < prevWeekStats.totalTasks ? '↓' : '→'}
              {Math.abs(stats.totalTasks - prevWeekStats.totalTasks)} vs last week
            </TrendIndicator>
          )}
        </StatCard>
        <StatCard>
          <StatLabel>Completed</StatLabel>
          <StatValue style={{ color: chartColors.primary }}>{stats.completedTasks}</StatValue>
          {prevWeekStats && completedTasksTrend.change > 0 && (
            <TrendIndicator $trend={completedTasksTrend.trend}>
              {completedTasksTrend.trend === 'up' ? '↑' : '↓'}
              {completedTasksTrend.change.toFixed(0)}% vs last week
            </TrendIndicator>
          )}
        </StatCard>
        <StatCard>
          <StatLabel>Completion Rate</StatLabel>
          <StatValue>{stats.completionPercentage.toFixed(1)}%</StatValue>
          {prevWeekStats && completionTrend.change > 0 && (
            <TrendIndicator $trend={completionTrend.trend}>
              {completionTrend.trend === 'up' ? '↑' : '↓'}
              {completionTrend.change.toFixed(1)}% vs last week
            </TrendIndicator>
          )}
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
              { key: 'Completed', color: chartColors.primary, name: 'Completed Tasks' },
              { key: 'Incomplete', color: chartColors.secondary, name: 'Incomplete Tasks' },
            ]}
            height={300}
            title="Daily Task Overview"
            description="Bar chart showing completed and incomplete tasks for each day of the week"
          />
        </ChartCard>
        <ChartCard>
          <ChartTitle>Weekly Completion</ChartTitle>
          <PieChartWrapper 
            data={completionPieData} 
            height={300}
            title="Weekly Completion Rate"
            description={`Pie chart showing ${stats.completedTasks} completed out of ${stats.totalTasks} total tasks this week`}
          />
        </ChartCard>
      </ChartsSection>

      {/* Productivity Insights */}
      <InsightsSection>
        {streak > 0 && (
          <InsightCard>
            <InsightIcon>🔥</InsightIcon>
            <InsightValue>{streak}</InsightValue>
            <InsightLabel>
              {streak === 1 ? 'Day Streak' : 'Days Streak'}
            </InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              Consecutive days with completed tasks
            </Text>
          </InsightCard>
        )}
        
        {bestDay && bestDay.count > 0 && (
          <InsightCard>
            <InsightIcon>⭐</InsightIcon>
            <InsightValue>{bestDay.day}</InsightValue>
            <InsightLabel>Most Productive Day</InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              {bestDay.count} {bestDay.count === 1 ? 'task' : 'tasks'} completed
            </Text>
          </InsightCard>
        )}

        {stats.completionPercentage >= 80 && (
          <InsightCard>
            <InsightIcon>🏆</InsightIcon>
            <InsightValue>Excellent!</InsightValue>
            <InsightLabel>High Achiever</InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              {stats.completionPercentage.toFixed(0)}% completion rate this week
            </Text>
          </InsightCard>
        )}
      </InsightsSection>

      <DailyBreakdownSection>
        <ChartTitle>Daily Task Breakdown</ChartTitle>
        <DailyGrid>
          {filteredDailyBreakdown.map((day) => {
            const dayDate = new Date(day.date);
            const dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'short' });
            const dayNumber = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const dayTasks = day.tasks || [];
            
            // Mini pie chart data for each day
            const dayPieData = [
              { name: 'Completed', value: day.completedTasks, color: chartColors.primary },
              { name: 'Incomplete', value: day.totalTasks - day.completedTasks, color: chartColors.secondary },
            ];
            
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
                
                {/* Mini pie chart visualization */}
                {day.totalTasks > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <PieChartWrapper 
                      data={dayPieData} 
                      height={120} 
                      showLegend={false}
                      title={`${dayName} completion`}
                      description={`${day.completedTasks} of ${day.totalTasks} tasks completed on ${dayName}`}
                    />
                  </div>
                )}
                
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

      {urgentTasks && filteredUrgentTasks.length > 0 && (
        <UrgentSection>
          <ChartTitle>Urgent Tasks This Week</ChartTitle>
          <UrgentList>
            {filteredUrgentTasks.map(task => (
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

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <UrgentSection>
          <ChartTitle>Unscheduled Tasks</ChartTitle>
          <Text style={{ marginBottom: '15px', color: 'inherit' }}>
            Tasks without due dates ({unscheduledTasks.length})
          </Text>
          <UrgentList>
            {unscheduledTasks.slice(0, 10).map((task: Task) => (
              <UrgentTaskCard key={task.id} $priority={task.priority || 'Low'}>
                <TaskHeader>
                  <UrgentTaskTitle>{task.title}</UrgentTaskTitle>
                  <PriorityBadge $priority={task.priority || 'Low'}>
                    {task.priority || 'Low'}
                  </PriorityBadge>
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
    </PageContainer>
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
