import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { statisticsService } from '../services/statisticsService';
import { taskService, type Task } from '../services/taskService';
import { taskGroupService } from '../services/taskGroupService';
import { useToast } from '../contexts/ToastContext';
import type { WeeklyStatistics, UrgentTask } from '../types/statistics';
import type { TaskGroup } from '../types/taskGroup';
import { BarChartWrapper } from '../components/charts/BarChartWrapper';
import { PieChartWrapper } from '../components/charts/PieChartWrapper';
import { chartColors } from '../components/charts/chartTheme';
import { 
  Card, 
  Button, 
  Text, 
  ContentContainer,
  IconButton,
  SmallBadge,
  ResponsiveGrid,
  TwoColumnGrid,
  ResponsiveDailyGrid,
  InputField,
  Select,
  ToggleGroup,
  ToggleButton,
  ScrollableContainer,
  SmallButton
} from '../components/ui';

// Note: PageContainer is now imported from '../components/ui' - no need to redefine

// Helper function to remove day suffix from task titles (e.g., "Task - Monday" -> "Task")
const removeDayPrefix = (title: string): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of days) {
    if (title.endsWith(` - ${day}`)) {
      return title.substring(0, title.length - day.length - 3); // Remove " - Day"
    }
  }
  return title;
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

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  font-size: 24px;
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

const DateRangeSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const WeekDisplay = styled(Text)`
  font-size: 14px;
  font-weight: 500;
`;

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
  font-size: 32px;
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

const ChartCard = styled(Card)`
  padding: 20px;
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out;

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ChartTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 15px 0;
  font-size: 18px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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

const UrgentTaskTitle = styled(Text)`
  font-weight: 500;
  font-size: 14px;
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
  justify-content: center;
  height: 100%;
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

const DayCard = styled(Card)`
  padding: 18px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-in;

  &:hover {
    transform: translateY(-3px);
  }
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 10px;
  margin-bottom: 12px;
`;

const DayHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const DayName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
`;

const DayDate = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const TaskCount = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const DayProgressContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 16px;
`;

const DayProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 6px;
  overflow: visible;
  position: relative;
`;

const DayProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => $percentage}%;
  background: linear-gradient(90deg, ${chartColors.primary} 0%, #45a049 100%);
  transition: width 0.5s ease;
  border-radius: ${({ $percentage }) => $percentage === 100 ? '6px' : '6px 0 0 6px'};
`;

const ProgressHeader = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  margin-bottom: 4px;
`;

const ProgressPercentage = styled.div<{ $percentage: number }>`
  position: absolute;
  left: ${({ $percentage }) => $percentage}%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: left 0.5s ease;
`;

const PercentageValue = styled.span<{ $percentage: number }>`
  font-size: 14px;
  font-weight: 700;
  color: ${chartColors.primary};
  position: relative;
  left: ${({ $percentage }) => {
    if ($percentage <= 2) return '24px';
    if ($percentage >= 98) return '-16px';
    return '0';
  }};
`;

const ProgressArrow = styled.div`
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid ${chartColors.primary};
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
  font-size: 14px;
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
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
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
  font-size: 12px;
`;

const GoalSection = styled.div`
  margin-bottom: 25px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  height: 100%;
`;

const GoalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const GoalTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  margin: 0;
`;

const GoalProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const GoalProgressFill = styled.div<{ $percentage: number; $achieved: boolean }>`
  height: 100%;
  background: ${({ $achieved, theme }) => 
    $achieved ? `linear-gradient(90deg, ${chartColors.primary} 0%, #45a049 100%)` : 
    `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%)`
  };
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
`;

const GoalStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
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
  font-size: 18px;
  margin: 0 0 12px 0;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
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
  font-size: 14px;
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

// Helper function to get border color for priority cards
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Critical': return chartColors.critical;
    case 'High': return chartColors.high;
    default: return chartColors.medium;
  }
};

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
        <Title>Weekly Progress Dashboard</Title>
        <WeekNavigation>
          {/* View Mode Toggle */}
          <ToggleGroup>
            <ToggleButton $active={viewMode === 'week'} onClick={() => handleViewModeChange('week')}>
              Week
            </ToggleButton>
            <ToggleButton $active={viewMode === 'month'} onClick={() => handleViewModeChange('month')}>
              Month
            </ToggleButton>
            <ToggleButton $active={viewMode === 'custom'} onClick={() => handleViewModeChange('custom')}>
              Custom
            </ToggleButton>
          </ToggleGroup>

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
          <Select 
            value={selectedGroupId || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGroupId(e.target.value || null)}
            style={{ minWidth: '200px' }}
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
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

      {/* Weekly Goal and Most Productive Day */}
      <GoalAndInsightGrid>
        <GoalSection>
          <GoalHeader>
            <GoalTitle>📊 Weekly Completion Goal</GoalTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Text style={{ fontSize: '14px' }}>Target:</Text>
              <InputField
                type="number"
                min="1"
                max="1000"
                value={weeklyGoal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateWeeklyGoal(Number.parseInt(e.target.value, 10) || 10)}
                style={{ width: '80px', textAlign: 'center' }}
              />
              <Text style={{ fontSize: '14px' }}>tasks</Text>
            </div>
          </GoalHeader>
          <GoalProgressBar>
            <GoalProgressFill 
              $percentage={(stats.completedTasks / weeklyGoal) * 100}
              $achieved={stats.completedTasks >= weeklyGoal}
            >
              {stats.completedTasks >= weeklyGoal ? '🎉 Goal Achieved!' : `${Math.round((stats.completedTasks / weeklyGoal) * 100)}%`}
            </GoalProgressFill>
          </GoalProgressBar>
          <GoalStats>
            <span>{stats.completedTasks} / {weeklyGoal} tasks completed</span>
            <span>
              {stats.completedTasks >= weeklyGoal 
                ? `+${stats.completedTasks - weeklyGoal} over goal!` 
                : `${weeklyGoal - stats.completedTasks} remaining`
              }
            </span>
          </GoalStats>
        </GoalSection>

        {bestDay && bestDay.count > 0 && (
          <InsightCard>
            <InsightIcon>
              <Award />
            </InsightIcon>
            <InsightValue>{bestDay.day}</InsightValue>
            <InsightLabel>Most Productive Day</InsightLabel>
            <Text style={{ fontSize: '12px', marginTop: '8px', color: 'inherit' }}>
              {bestDay.count} {bestDay.count === 1 ? 'task' : 'tasks'} completed
            </Text>
          </InsightCard>
        )}
      </GoalAndInsightGrid>

      <ResponsiveGrid minWidth="200px" gap={20} style={{ marginBottom: '30px' }}>
        <StatCard>
          <StatLabel>Total Tasks</StatLabel>
          <StatValue>{stats.totalTasks}</StatValue>
          {prevWeekStats && prevWeekStats.totalTasks > 0 && (
            <TrendIndicator $trend={stats.totalTasks > prevWeekStats.totalTasks ? 'up' : stats.totalTasks < prevWeekStats.totalTasks ? 'down' : 'neutral'}>
              {stats.totalTasks > prevWeekStats.totalTasks ? '↑' : stats.totalTasks < prevWeekStats.totalTasks ? '↓' : '→'}{' '}
              {Math.abs(stats.totalTasks - prevWeekStats.totalTasks)} vs last week
            </TrendIndicator>
          )}
        </StatCard>
        <StatCard>
          <StatLabel>Completed</StatLabel>
          <StatValue style={{ color: chartColors.primary }}>{stats.completedTasks}</StatValue>
          {prevWeekStats && completedTasksTrend.change > 0 && (
            <TrendIndicator $trend={completedTasksTrend.trend}>
              {completedTasksTrend.trend === 'up' ? '↑' : '↓'}{' '}
              {completedTasksTrend.change.toFixed(0)}% vs last week
            </TrendIndicator>
          )}
        </StatCard>
        <StatCard>
          <StatLabel>Completion Rate</StatLabel>
          <StatValue>{stats.completionPercentage.toFixed(1)}%</StatValue>
          {prevWeekStats && completionTrend.change > 0 && (
            <TrendIndicator $trend={completionTrend.trend}>
              {completionTrend.trend === 'up' ? '↑' : '↓'}{' '}
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
      </ResponsiveGrid>

      <TwoColumnGrid gap={20} style={{ marginBottom: '30px' }}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>Daily Task Overview</ChartTitle>
            <SmallButton onClick={() => exportChartAsImage('daily-chart', 'daily-task-overview')}>
              📥 Export
            </SmallButton>
          </ChartHeader>
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
        <ChartCard>
          <ChartHeader>
            <ChartTitle>Weekly Completion</ChartTitle>
            <SmallButton onClick={() => exportChartAsImage('weekly-pie-chart', 'weekly-completion')}>
              📥 Export
            </SmallButton>
          </ChartHeader>
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
        <ResponsiveDailyGrid gap={20} style={{ marginTop: '20px' }}>
          {filteredDailyBreakdown.map((day) => {
            const dayDate = new Date(day.date);
            const dayName = dayDate.toLocaleDateString('en-GB', { weekday: 'long' });
            const dayNumber = dayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const dayTasks = day.tasks || [];
            
            return (
              <DayCard key={day.date}>
                <DayHeader>
                  <DayHeaderLeft>
                    <DayName>{dayName}</DayName>
                    <DayDate>{dayNumber}</DayDate>
                  </DayHeaderLeft>
                  <TaskCount>
                    {day.completedTasks}/{day.totalTasks} tasks
                  </TaskCount>
                </DayHeader>
                
                {/* Progress bar with percentage above at completion point */}
                {day.totalTasks > 0 && (
                  <DayProgressContainer>
                    <ProgressHeader>
                      <ProgressPercentage $percentage={day.completionRate}>
                        <PercentageValue $percentage={day.completionRate}>{day.completionRate.toFixed(0)}%</PercentageValue>
                        <ProgressArrow />
                      </ProgressPercentage>
                    </ProgressHeader>
                    <DayProgressBar>
                      <DayProgressFill $percentage={day.completionRate} />
                    </DayProgressBar>
                  </DayProgressContainer>
                )}
                
                {dayTasks.length > 0 ? (
                  <ScrollableContainer style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {dayTasks.map((task) => (
                      <TaskItem key={task.id} $completed={task.completed}>
                        <TaskCheckbox 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id, task.completed)}
                        />
                        <TaskContent>
                          <TaskTitle $completed={task.completed} title={task.title}>
                            {removeDayPrefix(task.title)}
                          </TaskTitle>
                          <TaskMeta>
                            <SmallBadge style={{ backgroundColor: getPriorityColor(task.priority) }}>
                              {task.priority}
                            </SmallBadge>
                            {task.groupName && (
                              <TaskGroup>{task.groupName}</TaskGroup>
                            )}
                          </TaskMeta>
                        </TaskContent>
                      </TaskItem>
                    ))}
                  </ScrollableContainer>
                ) : (
                  <EmptyDay>No tasks</EmptyDay>
                )}
              </DayCard>
            );
          })}
        </ResponsiveDailyGrid>
      </DailyBreakdownSection>

      {urgentTasks && filteredUrgentTasks.length > 0 && (
        <UrgentSection>
          <ChartTitle>Urgent Tasks This Week</ChartTitle>
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
          <ChartTitle>Unscheduled Tasks</ChartTitle>
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
