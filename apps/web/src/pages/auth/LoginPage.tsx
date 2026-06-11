
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
