import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Flame, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
      <div className="mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]">
        <div className="bg-card rounded-lg p-5 min-h-[200px] flex items-center justify-center">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]">
        <div className="mb-8">
          <h1 className="m-0 text-2xl font-semibold">Weekly Progress Dashboard</h1>
        </div>
        <ErrorDisplay 
          message={error}
          onRetry={() => loadData()}
          title="Failed to Load Statistics"
        />
      </div>
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
    <div className="mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-[10px] md:w-[95%]">
      <div className="mb-8">
        <h1 className="m-0 text-2xl font-semibold">Weekly Progress Dashboard</h1>
        <div className="flex flex-col items-start gap-5 mt-5 flex-wrap md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-wrap">
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
              <div className="flex gap-2.5 items-center flex-wrap">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="Start date"
                  className="w-auto"
                />
                <span className="text-sm">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
                  placeholder="End date"
                  className="w-auto"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyCustomDateRange}
                  disabled={!customStartDate || !customEndDate}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group Filter Section */}
      {groups.length > 0 && (
        <div className="mb-6">
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
        </div>
      )}

      {/* Weekly Goal and Most Productive Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6 [&>*]:min-h-[180px]">
        <WeeklyGoalCard
          completedTasks={stats.completedTasks}
          weeklyGoal={weeklyGoal}
          onUpdateGoal={updateWeeklyGoal}
        />

        {bestDay && bestDay.count > 0 && (
          <Card className="p-5 flex flex-col items-center text-center justify-center h-full">
            <div className="mb-3 text-primary flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10">
              <Award />
            </div>
            <div className="text-2xl font-bold text-primary mb-2">{bestDay.day}</div>
            <span className="block text-muted-foreground">Most Productive Day</span>
            <span className="text-xs mt-2">
              {bestDay.count} {bestDay.count === 1 ? 'task' : 'tasks'} completed
            </span>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 mb-8">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <ChartCard 
          title="Daily Task Overview"
          headerAction={
            <Button variant="outline" size="sm" onClick={() => exportChartAsImage('daily-chart', 'daily-task-overview')}>
              <Download size={14} /> Export
            </Button>
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
            <Button variant="outline" size="sm" onClick={() => exportChartAsImage('weekly-pie-chart', 'weekly-completion')}>
              <Download size={14} /> Export
            </Button>
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
      </div>

      {/* Productivity Insights */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mt-5 mb-8">
        {streak > 0 && (
          <Card className="p-5 flex flex-col items-center text-center justify-center h-full">
            <div className="mb-3 text-primary flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10"><Flame /></div>
            <div className="text-2xl font-bold text-primary mb-2">{streak}</div>
            <span className="block text-muted-foreground">
              {streak === 1 ? 'Day Streak' : 'Days Streak'}
            </span>
            <span className="text-xs mt-2">
              Consecutive days with completed tasks
            </span>
          </Card>
        )}

        {stats.completionPercentage >= 80 && (
          <Card className="p-5 flex flex-col items-center text-center justify-center h-full">
            <div className="mb-3 text-primary flex items-center justify-center [&_svg]:w-10 [&_svg]:h-10"><Trophy /></div>
            <div className="text-2xl font-bold text-primary mb-2">Excellent!</div>
            <span className="block text-muted-foreground">High Achiever</span>
            <span className="text-xs mt-2">
              {stats.completionPercentage.toFixed(0)}% completion rate this week
            </span>
          </Card>
        )}
      </div>

      {/* Historical Completion Rate Chart */}
      <HistoricalCompletionChart />

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Daily Task Breakdown</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 mt-5">
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
        </div>
      </div>

      {urgentTasks && filteredUrgentTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Urgent Tasks This Week</h3>
          <div className="flex flex-col gap-2.5">
            {filteredUrgentTasks.map(task => (
              <Card key={task.id} className="p-4" style={{ borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{task.title}</span>
                  <Badge style={{ backgroundColor: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </Badge>
                </div>
                {task.description && <p className="text-sm">{task.description}</p>}
                {task.daysUntilDue !== undefined && (
                  <span className={cn("text-sm font-medium", task.daysUntilDue <= 2 ? "text-destructive" : "text-muted-foreground")}>
                    {task.daysUntilDue === 0 ? 'Due today' :
                     task.daysUntilDue === 1 ? 'Due tomorrow' :
                     `Due in ${task.daysUntilDue} days`}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Unscheduled Tasks</h3>
          <p className="text-sm mb-4">
            Tasks without due dates ({unscheduledTasks.length})
          </p>
          <div className="flex flex-col gap-2.5">
            {unscheduledTasks.slice(0, 10).map((task: Task) => (
              <Card key={task.id} className="p-4" style={{ borderLeft: `4px solid ${getPriorityColor(task.priority || 'Low')}` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{task.title}</span>
                  <Badge style={{ backgroundColor: getPriorityColor(task.priority || 'Low') }}>
                    {task.priority || 'Low'}
                  </Badge>
                </div>
                {task.description && <p className="text-sm">{task.description}</p>}
                {task.groupName && (
                  <span className="text-xs mt-2 block">
                    📁 {task.groupName}
                  </span>
                )}
              </Card>
            ))}
          </div>
          {unscheduledTasks.length > 10 && (
            <p className="text-sm mt-4 text-center">
              +{unscheduledTasks.length - 10} more unscheduled tasks
            </p>
          )}
        </div>
      )}
    </div>
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
