import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, Heading1, TextSecondary } from '../../../components/ui';
import { Calendar, BarChart3, UserIcon } from 'lucide-react';

const HeaderContainer = styled(Flex)`
  margin-bottom: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
  }

  > div:last-child {
    @media (max-width: 768px) {
      width: 100%;
      justify-content: stretch;

      button {
        flex: 1;
      }
    }
  }
`;

interface DashboardHeaderProps {
  username: string;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ username, onLogout }) => {
  const navigate = useNavigate();

  return (
    <HeaderContainer justify="space-between" align="center" as="header" role="banner">
      <div>
        <Heading1 style={{ margin: 0 }}>Dashboard</Heading1>
        <TextSecondary style={{ margin: '5px 0 0' }}>Welcome back, @{username}</TextSecondary>
      </div>
      <Flex gap={12} as="nav" aria-label="User navigation">
        <Button variant="outline" onClick={() => navigate('/calendar')} aria-label="View calendar">
          <Calendar size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Calendar
        </Button>
        <Button variant="outline" onClick={() => navigate('/weekly-progress')} aria-label="View weekly progress dashboard">
          <BarChart3 size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Weekly Progress
        </Button>
        <Button variant="outline" onClick={() => navigate('/profile')} aria-label="Go to profile page">
          <UserIcon size={18} aria-hidden="true" />
          Profile
        </Button>
        <Button variant="danger" onClick={onLogout} aria-label="Logout from account">
          Logout
        </Button>
      </Flex>
    </HeaderContainer>
  );
};
