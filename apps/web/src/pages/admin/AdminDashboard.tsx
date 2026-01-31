import { useEffect, useState } from 'react';
import { Users, Activity, BarChart3, Shield, UserCog, Settings } from 'lucide-react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { userManagementService, type UserStats } from '../../services/userManagementService';
import { PageLayout } from '../../components/layout/PageLayout';

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await userManagementService.getUserStats();
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageLayout 
      title="Admin Dashboard"
      subtitle="System overview and administrative controls"
      loading={isLoading}
    >
      <DashboardGrid>
        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#4CAF50">
              <Users size={24} />
            </StatsIcon>
            <StatsTitle>Total Users</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : userStats?.totalUsers || 0}</StatsValue>
          <StatsChange $positive>{userStats?.adminUsers || 0} administrators</StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#2196F3">
              <Activity size={24} />
            </StatsIcon>
            <StatsTitle>Verified Users</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : userStats?.verifiedUsers || 0}</StatsValue>
          <StatsChange $positive>
            {isLoading || !userStats ? '---' : `${Math.round((userStats.verifiedUsers / userStats.totalUsers) * 100)}%`} of total
          </StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#FF9800">
              <BarChart3 size={24} />
            </StatsIcon>
            <StatsTitle>Unverified</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : userStats?.unverifiedUsers || 0}</StatsValue>
          <StatsChange $positive={false}>Awaiting verification</StatsChange>
        </StatsCard>

        <StatsCard>
          <StatsHeader>
            <StatsIcon $color="#9C27B0">
              <Shield size={24} />
            </StatsIcon>
            <StatsTitle>Admin Users</StatsTitle>
          </StatsHeader>
          <StatsValue>{isLoading ? '---' : userStats?.adminUsers || 0}</StatsValue>
          <StatsChange $positive>With elevated privileges</StatsChange>
        </StatsCard>
      </DashboardGrid>

      <Section>
        <SectionTitle>
          <Settings size={20} />
          Quick Actions
        </SectionTitle>
        <QuickActionsGrid>
          <QuickActionButton onClick={() => navigate('/admin/users')}>
            <ActionIcon>
              <UserCog size={24} />
            </ActionIcon>
            <ActionLabel>Manage Users</ActionLabel>
          </QuickActionButton>

          <QuickActionButton onClick={() => navigate('/admin/settings')}>
            <ActionIcon>
              <Settings size={24} />
            </ActionIcon>
            <ActionLabel>System Settings</ActionLabel>
          </QuickActionButton>

          <QuickActionButton onClick={() => navigate('/design-system')}>
            <ActionIcon>
              <Settings size={24} />
            </ActionIcon>
            <ActionLabel>Design System</ActionLabel>
          </QuickActionButton>

          <QuickActionButton onClick={() => navigate('/version-history')}>
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
    </PageLayout>
  );
};

export default AdminDashboard;
