import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  ListTodo, 
  Calendar, 
  BarChart3, 
  UserIcon,
  LogOut,
  ChevronDown,
  Clock,
  History,
  CalendarClock,
  Sun,
  Moon
} from 'lucide-react';

const HeaderContainer = styled.header`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.success};
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const NavDropdown = styled.div`
  position: relative;
`;

const NavButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    transition: transform 0.2s ease;
  }

  &[aria-expanded="true"] svg:last-child {
    transform: rotate(180deg);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: ${({ $isOpen }) => ($isOpen ? 'translateY(0)' : 'translateY(-8px)')};
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 1001;
`;

const DropdownItem = styled.button<{ $isActive?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  background: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primaryLight : 'transparent'};
  border: none;
  color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : theme.colors.text};
  font-size: 14px;
  font-weight: ${({ $isActive }) => ($isActive ? 600 : 500)};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  &:first-child {
    border-radius: 12px 12px 0 0;
  }

  &:last-child {
    border-radius: 0 0 12px 12px;
  }

  svg {
    flex-shrink: 0;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 4px 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  @media (max-width: 768px) {
    padding: 6px 8px;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.2;
`;

const UserGreeting = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.2;
`;

const UserDropdown = styled(DropdownMenu)`
  right: 0;
  left: auto;
  min-width: 200px;
`;

const ThemeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

export const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setNavOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const navigationItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/events', icon: CalendarClock, label: 'Events' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/weekly-progress', icon: BarChart3, label: 'Progress' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setNavOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  if (!user) return null;

  return (
    <HeaderContainer role="banner">
      <LeftSection>
        <Logo onClick={() => navigate('/dashboard')}>
          <LayoutDashboard size={24} />
          Finance Manager
        </Logo>

        <NavDropdown data-dropdown>
          <NavButton 
            onClick={() => setNavOpen(!navOpen)}
            aria-expanded={navOpen}
            aria-haspopup="true"
          >
            Navigation
            <ChevronDown size={16} />
          </NavButton>
          <DropdownMenu $isOpen={navOpen}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <DropdownItem
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  $isActive={isActive}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {item.label}
                </DropdownItem>
              );
            })}
            <DropdownDivider />
            <DropdownItem onClick={() => handleNavigate('/version-history')}>
              <History size={18} />
              Version History
            </DropdownItem>
          </DropdownMenu>
        </NavDropdown>
      </LeftSection>

      <RightSection>
        <TimeDisplay>
          <Clock size={16} />
          {formatTime()} • {formatDate()}
        </TimeDisplay>

        <ThemeButton 
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </ThemeButton>

        <NavDropdown data-dropdown>
          <UserSection onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <UserAvatar>
              {user.username.charAt(0).toUpperCase()}
            </UserAvatar>
            <UserInfo>
              <UserName>@{user.username}</UserName>
              <UserGreeting>{getGreeting()}</UserGreeting>
            </UserInfo>
            <ChevronDown size={16} />
          </UserSection>
          <UserDropdown $isOpen={userMenuOpen}>
            <DropdownItem onClick={() => {
              handleNavigate('/profile');
              setUserMenuOpen(false);
            }}>
              <UserIcon size={18} />
              Profile Settings
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={handleLogout}>
              <LogOut size={18} />
              Sign Out
            </DropdownItem>
          </UserDropdown>
        </NavDropdown>
      </RightSection>
    </HeaderContainer>
  );
};
