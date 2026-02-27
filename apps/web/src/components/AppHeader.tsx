import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@finance-manager/ui';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
  Moon,
  Calculator,
  Palette,
  Shield,
} from 'lucide-react';
import CalculatorModal from './CalculatorModal';

export const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = () =>
    currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = () =>
    currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const navigationItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/events', icon: CalendarClock, label: 'Events' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/weekly-progress', icon: BarChart3, label: 'Progress' },
  ];

  if (!user) return null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-[1000] flex items-center justify-between border-b border-border bg-secondary/80 px-6 py-3 backdrop-blur-md shadow-sm md:px-4"
    >
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6 md:gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xl font-bold text-primary transition-colors hover:text-success md:text-lg"
        >
          <LayoutDashboard size={24} />
          Finance Manager
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Navigation
              <ChevronDown size={16} className="transition-transform duration-200 data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(isActive && 'bg-accent font-semibold')}
                >
                  <Icon size={18} className="mr-2 shrink-0" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/version-history')}>
              <History size={18} className="mr-2 shrink-0" />
              Version History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Time, Calculator, Theme, User */}
      <div className="flex items-center gap-5 md:gap-3">
        {/* Time display — hidden on smaller screens */}
        <div className="hidden items-center gap-2 text-sm font-medium text-muted-foreground lg:flex">
          <Clock size={16} />
          {formatTime()} &bull; {formatDate()}
        </div>

        {/* Calculator button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowCalculator(true)}
          title="Calculator"
          aria-label="Open calculator"
          className="size-9 md:size-8"
        >
          <Calculator size={20} />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="size-9 md:size-8"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-1.5 transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground md:size-7 md:text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden flex-col gap-0.5 lg:flex">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground leading-tight">
                  @{user.username}
                  {user.isAdmin && (
                    <span
                      title="Administrator"
                      className="inline-flex items-center justify-center rounded-sm bg-warning p-1 text-warning-foreground transition-transform hover:scale-110"
                    >
                      <Shield size={14} />
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">{getGreeting()}</span>
              </div>
              <ChevronDown size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon size={18} className="mr-2 shrink-0" />
              Profile Settings
            </DropdownMenuItem>
            {user.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield size={18} className="mr-2 shrink-0" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/design-system')}>
                  <Palette size={18} className="mr-2 shrink-0" />
                  Design System
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut size={18} className="mr-2 shrink-0" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}
    </header>
  );
};
