import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeToggle } from './components/ThemeToggle';
import { LoadingSpinner } from './components/ui';
import { WhatsNewModal } from './components/WhatsNewModal';
import { AppHeader } from './components/AppHeader';
import versionData from '../../../VERSION.json';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('./pages/auth/ResendVerificationPage'));
const WeeklyProgressPage = lazy(() => import('./pages/weekly-progress/WeeklyProgressPage'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const VersionHistoryPage = lazy(() => import('./pages/version/VersionHistoryPage'));

function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    // Check if user has seen this version's "What's New" modal
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    if (lastSeenVersion !== versionData.version) {
      // Show modal after a short delay to allow auth to complete
      const timer = setTimeout(() => {
        setShowWhatsNew(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseWhatsNew = () => {
    setShowWhatsNew(false);
    localStorage.setItem('lastSeenVersion', versionData.version);
  };
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ThemeToggle />
              <AppHeader />
              {showWhatsNew && <WhatsNewModal onClose={handleCloseWhatsNew} />}
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                <Route path="/resend-verification" element={<ResendVerificationPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/weekly-progress"
                  element={
                    <ProtectedRoute>
                      <WeeklyProgressPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <EventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/version-history"
                  element={
                    <ProtectedRoute>
                      <VersionHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
