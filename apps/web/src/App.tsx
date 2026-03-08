import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@life-manager/ui';
import { Loader2 } from 'lucide-react';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { WhatsNewModal } from './components/WhatsNewModal';
import { AppHeader } from './components/AppHeader';
import versionData from '@workspace/VERSION.json';

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
const EisenhowerMatrixPage = lazy(() => import('./pages/eisenhower/EisenhowerMatrixPage'));
const WhatCanIDoPage = lazy(() => import('./pages/suggestions/WhatCanIDoPage'));
const VersionHistoryPage = lazy(() => import('./pages/version/VersionHistoryPage'));
const DesignSystemPage = lazy(() => import('./pages/design-system/DesignSystemPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));

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
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="font-sans text-foreground antialiased">
              <a href="#main-content" className="skip-to-content">
                Skip to content
              </a>
              <AppHeader />
              {showWhatsNew && <WhatsNewModal onClose={handleCloseWhatsNew} />}
              <main id="main-content">
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
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
                  path="/matrix"
                  element={
                    <ProtectedRoute>
                      <EisenhowerMatrixPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suggestions"
                  element={
                    <ProtectedRoute>
                      <WhatCanIDoPage />
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
                <Route
                  path="/design-system"
                  element={
                    <AdminRoute>
                      <DesignSystemPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminRoute>
                      <SystemSettings />
                    </AdminRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              </main>
              </div>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  </ErrorBoundary>
  );
}

export default App;
