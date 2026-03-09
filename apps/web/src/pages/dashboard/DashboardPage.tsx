import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { taskService } from '../../services/taskService';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import {
  CheckCircle,
  Calendar,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import type { Event } from '../../types/event';

interface StatIconProps {
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-destructive/15 text-destructive',
  info: 'bg-primary/15 text-primary',
};

const StatIcon = ({ color = 'primary', children }: StatIconProps) => (
  <div className={cn('flex size-12 items-center justify-center rounded-lg', colorMap[color])}>
    {children}
  </div>
);

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  completed: boolean;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    taskGroups: 0,
    dueTodayCount: 0,
    overdueCount: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [tasks, events, groups] = await Promise.all([
        taskService.getTasks(),
        eventService.getEvents(),
        taskGroupService.getGroups()
      ]);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const completedTasks = tasks.filter(t => t.completed).length;
      const dueTodayCount = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= todayEnd;
      }).length;

      const overdueCount = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < today;
      }).length;

      // Get upcoming events (next 7 days)
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcoming = events
        .filter(e => {
          const eventStart = new Date(e.startDate);
          return eventStart >= now && eventStart <= nextWeek;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);

      // Get recent incomplete tasks
      const recent = tasks
        .filter(t => !t.completed)
        .sort((a, b) => {
          // Sort by priority then due date
          const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
          const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
          if (priorityDiff !== 0) return priorityDiff;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .slice(0, 5);

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        upcomingEvents: upcoming.length,
        taskGroups: groups.length,
        dueTodayCount,
        overdueCount
      });

      setUpcomingEvents(upcoming);
      setRecentTasks(recent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date >= today && date < tomorrow) {
      return `Today at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return `Tomorrow at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <PageLayout 
      title={`${getGreeting()}, ${user?.username}!`}
      subtitle="Here's your overview for today"
      loading={loading}
      loadingComponent={<div className="text-center p-6 text-sm text-muted-foreground">Loading your dashboard...</div>}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
        <button
          onClick={() => navigate('/tasks')}
          className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-secondary p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <StatIcon color="primary"><CheckCircle size={24} /></StatIcon>
          </div>
          <div className="font-display text-display-lg text-foreground">{stats.completedTasks}/{stats.totalTasks}</div>
          <div className="text-sm font-medium text-muted-foreground">Tasks Completed</div>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-secondary p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <StatIcon color="success"><Calendar size={24} /></StatIcon>
          </div>
          <div className="font-display text-display-lg text-foreground">{stats.upcomingEvents}</div>
          <div className="text-sm font-medium text-muted-foreground">Upcoming Events</div>
        </button>

        <button
          onClick={() => navigate('/tasks')}
          className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-secondary p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <StatIcon color="warning"><Clock size={24} /></StatIcon>
          </div>
          <div className="font-display text-display-lg text-foreground">{stats.dueTodayCount}</div>
          <div className="text-sm font-medium text-muted-foreground">Due Today</div>
        </button>

        <button
          onClick={() => navigate('/tasks')}
          className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-secondary p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <StatIcon color="error"><AlertCircle size={24} /></StatIcon>
          </div>
          <div className="font-display text-display-lg text-foreground">{stats.overdueCount}</div>
          <div className="text-sm font-medium text-muted-foreground">Overdue Tasks</div>
        </button>
      </div>

      {/* Quick Actions */}
      <h2 className="m-0 mb-4 font-display text-display-sm text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-5 text-left transition-all hover:translate-x-1 hover:border-primary hover:bg-primary/15"
        >
          <ListTodo size={20} />
          <span className="text-body-lg font-medium text-foreground">View All Tasks</span>
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-5 text-left transition-all hover:translate-x-1 hover:border-primary hover:bg-primary/15"
        >
          <Calendar size={20} />
          <span className="text-body-lg font-medium text-foreground">Open Calendar</span>
        </button>
        <button
          onClick={() => navigate('/weekly-progress')}
          className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-5 text-left transition-all hover:translate-x-1 hover:border-primary hover:bg-primary/15"
        >
          <TrendingUp size={20} />
          <span className="text-body-lg font-medium text-foreground">Weekly Progress</span>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-5 text-left transition-all hover:translate-x-1 hover:border-primary hover:bg-primary/15"
        >
          <FolderKanban size={20} />
          <span className="text-body-lg font-medium text-foreground">Manage Groups</span>
        </button>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8 rounded-lg border border-border bg-secondary p-6">
          <h2 className="m-0 mb-4 font-display text-display-sm text-foreground">Upcoming Events</h2>
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              className="mb-2 flex items-center justify-between rounded-lg bg-background p-3 last:mb-0"
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} />
                <div>
                  <div className="text-sm font-medium text-foreground">{event.title}</div>
                  <div className="text-xs font-medium text-muted-foreground">{formatEventDate(event.startDate)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Priority Tasks */}
      {recentTasks.length > 0 && (
        <div className="mb-8 rounded-lg border border-border bg-secondary p-6">
          <h2 className="m-0 mb-4 font-display text-display-sm text-foreground">Priority Tasks</h2>
          {recentTasks.map(task => (
            <div
              key={task.id}
              onClick={() => navigate('/tasks')}
              className="mb-2 flex cursor-pointer items-center justify-between rounded-lg bg-background p-3 last:mb-0"
            >
              <div className="flex items-center gap-3">
                <ListTodo size={16} />
                <div>
                  <div className="text-sm font-medium text-foreground">{task.title}</div>
                  {task.dueDate && (
                    <div className="text-xs font-medium text-muted-foreground">
                      Due: {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding — shown only when user has no tasks yet */}
      {!loading && stats.totalTasks === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles size={28} />
            </div>
          </div>
          <h2 className="mb-2 font-display text-display-sm text-foreground">Welcome &mdash; let&apos;s get started</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first task, add it to a group, and try the calendar view to see your week at a glance.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/tasks')}>
              <Plus size={16} className="mr-2" />
              Create your first task
            </Button>
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              <Calendar size={16} className="mr-2" />
              Open calendar
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Tip: Press <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">N</kbd> on the Tasks page to create a task,
            or <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">/</kbd> to search.
          </p>
        </div>
      )}
    </PageLayout>
  );
};

export default DashboardPage;
