import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute component restricts access to admin-only pages.
 * Redirects non-admin users to the dashboard with an error message.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    // Non-admin users are redirected to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
