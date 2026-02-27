import { useEffect, useState } from 'react';
import { Shield, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { systemConfigurationService, type SystemConfiguration } from '../../services/systemConfigurationService';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';

const settingValueClasses = (type?: 'success' | 'warning' | 'error') => {
  const base = 'text-sm font-semibold px-4 py-1.5 rounded-lg';
  switch (type) {
    case 'success': return cn(base, 'bg-success/20 text-success');
    case 'warning': return cn(base, 'bg-warning/20 text-warning');
    case 'error': return cn(base, 'bg-destructive/20 text-destructive');
    default: return cn(base, 'bg-border text-foreground');
  }
};

const SystemSettings = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await systemConfigurationService.getConfiguration();
        setConfig(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load configuration';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <PageLayout title="System Settings" loading={true}>
        <div className="text-center py-10 text-muted-foreground">Loading configuration...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="System Settings"
      subtitle="View and manage system configuration settings"
      loading={false}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/20 p-4 text-destructive">
          {error}
        </div>
      )}

      {config && (
        <>
          {/* Warning Banner */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
            <div className="mt-0.5 shrink-0 text-warning">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-sm font-semibold text-warning">Read-Only Configuration</div>
              <div className="text-[13px] leading-relaxed text-foreground">
                These settings are currently read-only and loaded from configuration files. 
                To modify them, update the appsettings.json or appsettings.Development.json files 
                and restart the API. Future updates will allow dynamic configuration changes.
              </div>
            </div>
          </div>

          <div className="grid gap-6 max-w-[1000px]">
            {/* Environment Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/20 text-info">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Environment</h2>
              </div>
              <div className="flex items-center justify-between py-4 first:pt-0 last:border-b-0 last:pb-0">
                <div className="flex-1">
                  <div className="mb-1 text-[15px] font-medium text-foreground">Current Environment</div>
                  <div className="text-[13px] text-muted-foreground">
                    The runtime environment the API is currently running in
                  </div>
                </div>
                <span className={settingValueClasses(config.environment === 'Development' ? 'warning' : 'success')}>
                  {config.environment}
                </span>
              </div>
            </div>

            {/* Rate Limiting Configuration */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20 text-warning">
                  <Activity size={20} />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Rate Limiting</h2>
              </div>
              <div className="flex items-center justify-between border-b border-border py-4 first:pt-0">
                <div className="flex-1">
                  <div className="mb-1 text-[15px] font-medium text-foreground">Rate Limiting Status</div>
                  <div className="text-[13px] text-muted-foreground">
                    Whether rate limiting is active for API requests
                  </div>
                </div>
                <span className={settingValueClasses(config.rateLimit.enabled ? 'success' : 'error')}>
                  {config.rateLimit.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-4">
                <div className="flex-1">
                  <div className="mb-1 text-[15px] font-medium text-foreground">Requests Per Minute</div>
                  <div className="text-[13px] text-muted-foreground">
                    Maximum number of requests allowed per minute per IP address
                  </div>
                </div>
                <span className={settingValueClasses()}>
                  {config.rateLimit.maxRequestsPerMinute}
                </span>
              </div>
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div className="flex-1">
                  <div className="mb-1 text-[15px] font-medium text-foreground">Requests Per Hour</div>
                  <div className="text-[13px] text-muted-foreground">
                    Maximum number of requests allowed per hour per IP address
                  </div>
                </div>
                <span className={settingValueClasses()}>
                  {config.rateLimit.maxRequestsPerHour}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default SystemSettings;
