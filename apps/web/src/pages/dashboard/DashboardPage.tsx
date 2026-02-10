import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { taskService } from '../../services/taskService';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { PageLayout } from '../../components/layout/PageLayout';
import { 
  CheckCircle, 
  Calendar, 
  FolderKanban, 
  ListTodo, 
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import styled from 'styled-components';
import { borderRadius } from '@finance-manager/ui/styles';
import type { Event } from '../../types/event';


const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.xl};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface StatIconProps {
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const StatIcon = styled.div<StatIconProps>`
  width: 48px;
  height: 48px;
  border-radius: ${borderRadius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, color = 'primary' }) => `${theme.colors[color]}15`};
  color: ${({ theme, color = 'primary' }) => theme.colors[color]};
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const QuickActionCard = styled.button`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.xl};
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}15;
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateX(4px);
  }

  span {
    font-size: 15px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const UpcomingSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.xl};
  padding: 24px;
  margin-bottom: 32px;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: ${borderRadius.lg};
  background: ${({ theme }) => theme.colors.background};
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const EventDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EventDate = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

const EventTitle = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
`;

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
      loadingComponent={<EmptyState>Loading your dashboard...</EmptyState>}
    >
      <DashboardGrid>
        <StatCard onClick={() => navigate('/tasks')}>
          <StatHeader>
            <StatIcon color="primary">
              <CheckCircle size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.completedTasks}/{stats.totalTasks}</StatValue>
          <StatLabel>Tasks Completed</StatLabel>
        </StatCard>

        <StatCard onClick={() => navigate('/calendar')}>
          <StatHeader>
            <StatIcon color="success">
              <Calendar size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.upcomingEvents}</StatValue>
          <StatLabel>Upcoming Events</StatLabel>
        </StatCard>

        <StatCard onClick={() => navigate('/tasks')}>
          <StatHeader>
            <StatIcon color="warning">
              <Clock size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.dueTodayCount}</StatValue>
          <StatLabel>Due Today</StatLabel>
        </StatCard>

        <StatCard onClick={() => navigate('/tasks')}>
          <StatHeader>
            <StatIcon color="error">
              <AlertCircle size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.overdueCount}</StatValue>
          <StatLabel>Overdue Tasks</StatLabel>
        </StatCard>
      </DashboardGrid>

      <SectionTitle>Quick Actions</SectionTitle>
      <QuickActionsGrid>
        <QuickActionCard onClick={() => navigate('/tasks')}>
          <ListTodo size={20} />
          <span>View All Tasks</span>
        </QuickActionCard>
        <QuickActionCard onClick={() => navigate('/calendar')}>
          <Calendar size={20} />
          <span>Open Calendar</span>
        </QuickActionCard>
        <QuickActionCard onClick={() => navigate('/weekly-progress')}>
          <TrendingUp size={20} />
          <span>Weekly Progress</span>
        </QuickActionCard>
        <QuickActionCard onClick={() => navigate('/tasks')}>
          <FolderKanban size={20} />
          <span>Manage Groups</span>
        </QuickActionCard>
      </QuickActionsGrid>

      {upcomingEvents.length > 0 && (
        <UpcomingSection>
          <SectionTitle>Upcoming Events</SectionTitle>
          {upcomingEvents.map(event => (
            <EventItem key={event.id}>
              <EventDetails>
                <Calendar size={16} />
                <div>
                  <EventTitle>{event.title}</EventTitle>
                  <EventDate>{formatEventDate(event.startDate)}</EventDate>
                </div>
              </EventDetails>
            </EventItem>
          ))}
        </UpcomingSection>
      )}

      {recentTasks.length > 0 && (
        <UpcomingSection>
          <SectionTitle>Priority Tasks</SectionTitle>
          {recentTasks.map(task => (
            <EventItem key={task.id} onClick={() => navigate('/tasks')}>
              <EventDetails>
                <ListTodo size={16} />
                <div>
                  <EventTitle>{task.title}</EventTitle>
                  {task.dueDate && (
                    <EventDate>
                      Due: {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </EventDate>
                  )}
                </div>
              </EventDetails>
            </EventItem>
          ))}
        </UpcomingSection>
      )}
    </PageLayout>
  );
};

export default DashboardPage;
