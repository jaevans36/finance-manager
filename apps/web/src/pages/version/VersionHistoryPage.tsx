import { useState } from 'react';
import { Container } from '../../components/ui';
import { Package, Calendar, Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Zap, Bug, FileText } from 'lucide-react';
import styled from 'styled-components';
import versionData from '@workspace/VERSION.json';

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 32px 0;
`;

const CurrentVersionCard = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.success} 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const VersionNumber = styled.div`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const VersionBadge = styled.span`
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const VersionCodename = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  opacity: 0.95;
`;

const VersionInfo = styled.div`
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.9;
  align-items: center;
`;

const VersionCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

interface VersionHeaderProps {
  $expanded: boolean;
}

const VersionHeader = styled.div<VersionHeaderProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ $expanded }) => ($expanded ? '20px' : '0')};
  cursor: pointer;
`;

const VersionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VersionNum = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const VersionDate = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

interface ChangelogContentProps {
  $expanded: boolean;
}

const ChangelogContent = styled.div<ChangelogContentProps>`
  display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
`;

const ChangeSection = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ChangeSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChangeItem = styled.li`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: start;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

interface ChangeIconProps {
  $type: string;
}

const ChangeIcon = styled.span<ChangeIconProps>`
  flex-shrink: 0;
  margin-top: 2px;
  color: ${({ theme, $type }) => {
    switch ($type) {
      case 'feat': return theme.colors.success;
      case 'fix': return theme.colors.error;
      case 'perf': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  }};
`;

interface ImpactBadgeProps {
  $impact: string;
}

const ImpactBadge = styled.span<ImpactBadgeProps>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${({ theme, $impact }) => {
    switch ($impact) {
      case 'high': return `${theme.colors.error}20`;
      case 'medium': return `${theme.colors.warning}20`;
      default: return `${theme.colors.textSecondary}20`;
    }
  }};
  color: ${({ theme, $impact }) => {
    switch ($impact) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  }};
  margin-left: 8px;
`;

// Mock changelog data - in production, this would come from an API or imported JSON
const mockChangelog = [
  {
    version: '0.12.0',
    releaseDate: '2025-12-20',
    codename: 'Calendar View',
    changelog: [
      { type: 'feat', category: 'Calendar', description: 'Monthly calendar interface for visualizing tasks', impact: 'high' },
      { type: 'feat', category: 'Calendar', description: 'Day cells with task count badges and color-coded priorities', impact: 'medium' },
      { type: 'feat', category: 'UX', description: 'Responsive design with mobile swipe gestures', impact: 'low' }
    ]
  },
  {
    version: '0.11.0',
    releaseDate: '2025-12-15',
    codename: 'Weekly Progress Dashboard',
    changelog: [
      { type: 'feat', category: 'Analytics', description: 'Comprehensive weekly analytics with visualization', impact: 'high' },
      { type: 'feat', category: 'Charts', description: 'Bar charts and pie charts using Recharts library', impact: 'high' },
      { type: 'feat', category: 'Statistics', description: 'Historical completion rate chart (8-week trend)', impact: 'medium' }
    ]
  },
  {
    version: '0.10.0',
    releaseDate: '2025-12-01',
    codename: 'Username System',
    changelog: [
      { type: 'feat', category: 'Auth', description: 'Unique username field for user accounts', impact: 'medium' },
      { type: 'feat', category: 'Auth', description: 'Real-time username availability checking', impact: 'low' },
      { type: 'feat', category: 'Auth', description: 'Login with username or email', impact: 'medium' }
    ]
  }
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feat': return <CheckCircle2 size={16} />;
    case 'fix': return <Bug size={16} />;
    case 'perf': return <Zap size={16} />;
    default: return <FileText size={16} />;
  }
};

const VersionHistoryPage = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['0.13.0']));

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <Container style={{ padding: '20px', maxWidth: '1000px', width: '80%' }}>
      <PageTitle>Version History</PageTitle>
      <PageSubtitle>Explore the evolution of To Do Manager and see what&apos;s been added in each release</PageSubtitle>

      <CurrentVersionCard>
        <VersionNumber>
          <Package size={48} />
          v{versionData.version}
          <VersionBadge>CURRENT</VersionBadge>
        </VersionNumber>
        {versionData.codename && <VersionCodename>&quot;{versionData.codename}&quot;</VersionCodename>}
        <VersionInfo>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} />
            Released {formatDate(versionData.releaseDate)}
          </span>
          {versionData.breaking && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              Breaking Changes
            </span>
          )}
        </VersionInfo>
        <p style={{ marginTop: '16px', fontSize: '16px', opacity: 0.95 }}>
          {versionData.description}
        </p>
      </CurrentVersionCard>

      {/* Current Version Changelog */}
      <VersionCard>
        <VersionHeader $expanded={expandedVersions.has(versionData.version)} onClick={() => toggleVersion(versionData.version)}>
          <VersionTitle>
            <VersionNum>v{versionData.version}</VersionNum>
            {versionData.codename && <span style={{ fontSize: '14px', color: '#888' }}>&quot;{versionData.codename}&quot;</span>}
          </VersionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <VersionDate>
              <Calendar size={14} />
              {formatDate(versionData.releaseDate)}
            </VersionDate>
            <ExpandButton>
              {expandedVersions.has(versionData.version) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </ExpandButton>
          </div>
        </VersionHeader>

        <ChangelogContent $expanded={expandedVersions.has(versionData.version)}>
          {versionData.changelog.length > 0 && (
            <ChangeSection>
              <ChangeSectionTitle>
                <Info size={16} />
                Changes
              </ChangeSectionTitle>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                {versionData.changelog.map((change, idx) => (
                  <ChangeItem key={idx}>
                    <ChangeIcon $type={change.type}>
                      {getChangeIcon(change.type)}
                    </ChangeIcon>
                    <span>
                      <strong>{change.category}:</strong> {change.description}
                      {change.impact && <ImpactBadge $impact={change.impact}>{change.impact}</ImpactBadge>}
                    </span>
                  </ChangeItem>
                ))}
              </ul>
            </ChangeSection>
          )}
        </ChangelogContent>
      </VersionCard>

      {/* Previous Versions */}
      {mockChangelog.map(version => (
        <VersionCard key={version.version}>
          <VersionHeader $expanded={expandedVersions.has(version.version)} onClick={() => toggleVersion(version.version)}>
            <VersionTitle>
              <VersionNum>v{version.version}</VersionNum>
              {version.codename && <span style={{ fontSize: '14px', color: '#888' }}>&quot;{version.codename}&quot;</span>}
            </VersionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <VersionDate>
                <Calendar size={14} />
                {formatDate(version.releaseDate)}
              </VersionDate>
              <ExpandButton>
                {expandedVersions.has(version.version) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </ExpandButton>
            </div>
          </VersionHeader>

          <ChangelogContent $expanded={expandedVersions.has(version.version)}>
            {version.changelog.length > 0 && (
              <ChangeSection>
                <ChangeSectionTitle>
                  <Info size={16} />
                  Changes
                </ChangeSectionTitle>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                  {version.changelog.map((change, idx) => (
                    <ChangeItem key={idx}>
                      <ChangeIcon $type={change.type}>
                        {getChangeIcon(change.type)}
                      </ChangeIcon>
                      <span>
                        <strong>{change.category}:</strong> {change.description}
                        {change.impact && <ImpactBadge $impact={change.impact}>{change.impact}</ImpactBadge>}
                      </span>
                    </ChangeItem>
                  ))}
                </ul>
              </ChangeSection>
            )}
          </ChangelogContent>
        </VersionCard>
      ))}

      <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '32px' }}>
        For complete version history, see <a href="https://github.com/jaevans36/finance-manager/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>CHANGELOG.md</a>
      </p>
    </Container>
  );
};

export default VersionHistoryPage;
