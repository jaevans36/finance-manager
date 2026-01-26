import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Flex, Heading1, TextSecondary } from '@finance-manager/ui';
import { LayoutDashboard, ListTodo, Calendar, BarChart3, UserIcon } from 'lucide-react';

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

const NavButton = styled(Button)<{ $isActive?: boolean }>`
  background: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) => 
    $isActive ? '#fff' : theme.colors.text};
  border-color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : theme.colors.border};

  &:hover {
    background: ${({ $isActive, theme }) => 
      $isActive ? theme.colors.primary : theme.colors.backgroundSecondary};
    color: ${({ $isActive }) => $isActive ? '#fff' : 'inherit'};
  }
`;

interface DashboardHeaderProps {
  username: string;
  onLogout: () => void;
}

export const DashboardHeader = ({ username, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <HeaderContainer justify="space-between" align="center" as="header" role="banner">
      <div>
        <Heading1 style={{ margin: 0 }}>To Do Manager</Heading1>
        <TextSecondary style={{ margin: '5px 0 0' }}>Welcome back, @{username}</TextSecondary>
      </div>
      <Flex gap={12} as="nav" aria-label="User navigation">
        <NavButton 
          variant="outline" 
          onClick={() => navigate('/dashboard')} 
          aria-label="View dashboard"
          $isActive={location.pathname === '/dashboard'}
        >
          <LayoutDashboard size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Dashboard
        </NavButton>
        <NavButton 
          variant="outline" 
          onClick={() => navigate('/tasks')} 
          aria-label="View tasks"
          $isActive={location.pathname === '/tasks'}
        >
          <ListTodo size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Tasks
        </NavButton>
        <NavButton 
          variant="outline" 
          onClick={() => navigate('/calendar')} 
          aria-label="View calendar"
          $isActive={location.pathname === '/calendar'}
        >
          <Calendar size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Calendar
        </NavButton>
        <NavButton 
          variant="outline" 
          onClick={() => navigate('/weekly-progress')} 
          aria-label="View weekly progress"
          $isActive={location.pathname === '/weekly-progress'}
        >
          <BarChart3 size={18} aria-hidden="true" style={{ marginRight: 4 }} />
          Progress
        </NavButton>
        <NavButton 
          variant="outline" 
          onClick={() => navigate('/profile')} 
          aria-label="Go to profile page"
          $isActive={location.pathname === '/profile'}
        >
          <UserIcon size={18} aria-hidden="true" />
          Profile
        </NavButton>
        <Button variant="danger" onClick={onLogout} aria-label="Logout from account">
          Logout
        </Button>
      </Flex>
    </HeaderContainer>
  );
};
