import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-muted text-5xl font-bold text-muted-foreground">
        404
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-2" />
          Go back
        </Button>
        {isAuthenticated ? (
          <Button onClick={() => navigate('/dashboard')}>
            <Home size={16} className="mr-2" />
            Go to dashboard
          </Button>
        ) : (
          <Button onClick={() => navigate('/login')}>
            <LogIn size={16} className="mr-2" />
            Log in
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
