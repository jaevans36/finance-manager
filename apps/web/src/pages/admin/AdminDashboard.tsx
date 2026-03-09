import { useEffect, useState } from 'react';
import { Users, Activity, BarChart3, Shield, UserCog, Settings, Terminal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { userManagementService, type UserStats } from '../../services/userManagementService';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';

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
      } catch (error: unknown) {
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
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 mb-8">
        <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20 text-success">
              <Users size={24} />
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Total Users</h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{isLoading ? '---' : userStats?.totalUsers || 0}</div>
          <div className="text-[13px] font-medium text-success">{userStats?.adminUsers || 0} administrators</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/20 text-info">
              <Activity size={24} />
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Verified Users</h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{isLoading ? '---' : userStats?.verifiedUsers || 0}</div>
          <div className="text-[13px] font-medium text-success">
            {isLoading || !userStats ? '---' : `${Math.round((userStats.verifiedUsers / userStats.totalUsers) * 100)}%`} of total
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Unverified</h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{isLoading ? '---' : userStats?.unverifiedUsers || 0}</div>
          <div className="text-[13px] font-medium text-destructive">Awaiting verification</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Shield size={24} />
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Admin Users</h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">{isLoading ? '---' : userStats?.adminUsers || 0}</div>
          <div className="text-[13px] font-medium text-success">With elevated privileges</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
          <Settings size={20} />
          Quick Actions
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <UserCog size={24} />
            </div>
            <span className="text-sm font-medium text-center">Manage Users</span>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Settings size={24} />
            </div>
            <span className="text-sm font-medium text-center">System Settings</span>
          </button>

          <button
            onClick={() => navigate('/design-system')}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Settings size={24} />
            </div>
            <span className="text-sm font-medium text-center">Design System</span>
          </button>

          <button
            onClick={() => navigate('/version-history')}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Activity size={24} />
            </div>
            <span className="text-sm font-medium text-center">Version History</span>
          </button>

          <button
            onClick={() => navigate('/admin/logs')}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-foreground transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Terminal size={24} />
            </div>
            <span className="text-sm font-medium text-center">View Logs</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
          <Activity size={20} />
          Recent Activity
        </h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="border-b border-border py-3 first:pt-0 last:border-b-0">
            <p className="mb-1 text-sm text-foreground">New user registered: john.doe@example.com</p>
            <span className="text-xs text-muted-foreground">2 minutes ago</span>
          </div>
          <div className="border-b border-border py-3 last:border-b-0">
            <p className="mb-1 text-sm text-foreground">Admin privileges granted to: jane.smith@example.com</p>
            <span className="text-xs text-muted-foreground">1 hour ago</span>
          </div>
          <div className="border-b border-border py-3 last:border-b-0">
            <p className="mb-1 text-sm text-foreground">System maintenance completed</p>
            <span className="text-xs text-muted-foreground">3 hours ago</span>
          </div>
          <div className="py-3">
            <p className="mb-1 text-sm text-foreground">Database backup successful</p>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
