import { useEffect, useState } from 'react';
import { Container } from '@finance-manager/ui';
import { Users, Activity, BarChart3, Shield, UserCog, Settings } from 'lucide-react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageSubtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 32px 0;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
`;

const StatsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

interface StatsIconProps {
  $color: string;
}

const StatsIcon = styled.div<StatsIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatsTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatsValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const StatsChange = styled.div<{ $positive?: boolean }>`
  font-size: 13px;
  color: ${({ theme, $positive }) => 
    $positive ? theme.colors.success : theme.colors.error};
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const QuickActionButton = styled.button`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`;

const ActivityList = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const ActivityItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityText = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const ActivityTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  totalEvents: number;
  adminUsers: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    totalEvents: 0,
    adminUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now, using mock data
    setTimeout(() => {
      setStats({
        totalUsers: 156,
        activeUsers: 87,
        totalTasks: 2340,
        totalEvents: 458,
        adminUsers: 3
      });
      setIsLoading(false);
    }, 500);
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container style={{ padding: '20px', maxWidth: '1400px', width: '95%' }}>
      <PageTitle>
        <Shield size={36} />
        Admin Dashboard
      </PageTitle>
      <PageSubtitle>System overview and administrative controls</PageSubtitle>

      <DashboardGrid>
        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#4CAF50">
              <Users size={24} />
            </StatsIcon>
            <StatsTitle>Total Users</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : stats.totalUsers}</StatsValue>
          <StatsChange $positive>{stats.adminUsers} administrators</StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#2196F3">
              <Activity size={24} />
            </StatsIcon>
            <StatsTitle>Active Users</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : stats.activeUsers}</StatsValue>
          <StatsChange $positive>
            {isLoading ? '---' : `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`} of total
          </StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#FF9800">
              <BarChart3 size={24} />
            </StatsIcon>
            <StatsTitle>Total Tasks</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : stats.totalTasks.toLocaleString()}</StatsValue>
          <StatsChange $positive>Across all users</StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#9C27B0">
              <Activity size={24} />
            </StatsIcon>
            <StatsTitle>Total Events</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : stats.totalEvents.toLocaleString()}</StatsValue>
          <StatsChange $positive>Scheduled events</StatsChange>
        </StatsCard>
      </DashboardGrid>

      <Section>
        <SectionTitle>
          <Settings size={20} />
          Quick Actions
        </SectionTitle>
        <QuickActionsGrid>
          <QuickActionButton onClick={() => window.location.href = '/admin/users'}>
            <ActionIcon>
              <UserCog size={24} />
            </ActionIcon>
            <ActionLabel>Manage Users</ActionLabel>
          </QuickActionButton>

          <QuickActionButton onClick={() => window.location.href = '/design-system'}>
            <ActionIcon>
              <Settings size={24} />
            </ActionIcon>
            <ActionLabel>Design System</ActionLabel>
          </QuickActionButton>

          <QuickActionButton onClick={() => window.location.href = '/version-history'}>
            <ActionIcon>
              <Activity size={24} />
            </ActionIcon>
            <ActionLabel>Version History</ActionLabel>
          </QuickActionButton>
        </QuickActionsGrid>
      </Section>

      <Section>
        <SectionTitle>
          <Activity size={20} />
          Recent Activity
        </SectionTitle>
        <ActivityList>
          <ActivityItem>
            <ActivityText>New user registered: john.doe@example.com</ActivityText>
            <ActivityTime>2 minutes ago</ActivityTime>
          </ActivityItem>
          <ActivityItem>
            <ActivityText>Admin privileges granted to: jane.smith@example.com</ActivityText>
            <ActivityTime>1 hour ago</ActivityTime>
          </ActivityItem>
          <ActivityItem>
            <ActivityText>System maintenance completed</ActivityText>
            <ActivityTime>3 hours ago</ActivityTime>
          </ActivityItem>
          <ActivityItem>
            <ActivityText>Database backup successful</ActivityText>
            <ActivityTime>1 day ago</ActivityTime>
          </ActivityItem>
        </ActivityList>
      </Section>
    </Container>
  );
};

export default AdminDashboard;
