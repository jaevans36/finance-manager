import { useEffect, useState } from 'react';
import { Shield, Activity, AlertCircle } from 'lucide-react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { systemConfigurationService, type SystemConfiguration } from '../../services/systemConfigurationService';
import { PageLayout } from '../../components/layout/PageLayout';

const SettingsGrid = styled.div`
  display: grid;
  gap: 24px;
  max-width: 1000px;
`;

const SettingSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const SectionIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const SettingLabel = styled.div`
  flex: 1;
`;

const SettingName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SettingValue = styled.div<{ $type?: 'success' | 'warning' | 'error' }>`
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  background: ${({ theme, $type }) => {
    if ($type === 'success') return theme.colors.success + '20';
    if ($type === 'warning') return theme.colors.warning + '20';
    if ($type === 'error') return theme.colors.error + '20';
    return theme.colors.border;
  }};
  color: ${({ theme, $type }) => {
    if ($type === 'success') return theme.colors.success;
    if ($type === 'warning') return theme.colors.warning;
    if ($type === 'error') return theme.colors.error;
    return theme.colors.text;
  }};
`;

const WarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.warning}15;
  border: 1px solid ${({ theme }) => theme.colors.warning}40;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const WarningIcon = styled.div`
  color: ${({ theme }) => theme.colors.warning};
  flex-shrink: 0;
  margin-top: 2px;
`;

const WarningText = styled.div`
  flex: 1;
`;

const WarningTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.warning};
  margin-bottom: 4px;
`;

const WarningDescription = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.error}20;
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 24px;
`;

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
      } catch (err) {
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
        <LoadingMessage>Loading configuration...</LoadingMessage>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="System Settings"
      subtitle="View and manage system configuration settings"
      loading={false}
    >
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {config && (
        <>
          <WarningBanner>
            <WarningIcon>
              <AlertCircle size={20} />
            </WarningIcon>
            <WarningText>
              <WarningTitle>Read-Only Configuration</WarningTitle>
              <WarningDescription>
                These settings are currently read-only and loaded from configuration files. 
                To modify them, update the appsettings.json or appsettings.Development.json files 
                and restart the API. Future updates will allow dynamic configuration changes.
              </WarningDescription>
            </WarningText>
          </WarningBanner>

          <SettingsGrid>
            {/* Environment Information */}
            <SettingSection>
              <SectionHeader>
                <SectionIcon $color="#2196F3">
                  <Shield size={20} />
                </SectionIcon>
                <SectionTitle>Environment</SectionTitle>
              </SectionHeader>
              <SettingRow>
                <SettingLabel>
                  <SettingName>Current Environment</SettingName>
                  <SettingDescription>
                    The runtime environment the API is currently running in
                  </SettingDescription>
                </SettingLabel>
                <SettingValue $type={config.environment === 'Development' ? 'warning' : 'success'}>
                  {config.environment}
                </SettingValue>
              </SettingRow>
            </SettingSection>

            {/* Rate Limiting Configuration */}
            <SettingSection>
              <SectionHeader>
                <SectionIcon $color="#FF9800">
                  <Activity size={20} />
                </SectionIcon>
                <SectionTitle>Rate Limiting</SectionTitle>
              </SectionHeader>
              <SettingRow>
                <SettingLabel>
                  <SettingName>Rate Limiting Status</SettingName>
                  <SettingDescription>
                    Whether rate limiting is active for API requests
                  </SettingDescription>
                </SettingLabel>
                <SettingValue $type={config.rateLimit.enabled ? 'success' : 'error'}>
                  {config.rateLimit.enabled ? 'Enabled' : 'Disabled'}
                </SettingValue>
              </SettingRow>
              <SettingRow>
                <SettingLabel>
                  <SettingName>Requests Per Minute</SettingName>
                  <SettingDescription>
                    Maximum number of requests allowed per minute per IP address
                  </SettingDescription>
                </SettingLabel>
                <SettingValue>
                  {config.rateLimit.maxRequestsPerMinute}
                </SettingValue>
              </SettingRow>
              <SettingRow>
                <SettingLabel>
                  <SettingName>Requests Per Hour</SettingName>
                  <SettingDescription>
                    Maximum number of requests allowed per hour per IP address
                  </SettingDescription>
                </SettingLabel>
                <SettingValue>
                  {config.rateLimit.maxRequestsPerHour}
                </SettingValue>
              </SettingRow>
            </SettingSection>
          </SettingsGrid>
        </>
      )}
    </PageLayout>
  );
};

export default SystemSettings;
