import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useLoginForm } from '../../hooks/forms';
import type { LoginInput } from '@life-manager/schema';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AppLogo } from '../AppLogo';

export const LoginForm = () => {
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useLoginForm();

  const onSubmit = async (data: LoginInput) => {
    setApiError('');

    try {
      const response = await authService.login(data.emailOrUsername, data.password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Login failed. Please check your credentials.');
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-[400px] p-5">
      <div className="mb-6 flex flex-col items-center gap-2">
        <AppLogo size={48} />
        <span className="text-xl font-bold tracking-tight text-foreground">Life Manager</span>
      </div>
      <h2 className="mb-5 text-foreground">Sign In</h2>
      
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <XCircle />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
        <div className="mb-4 space-y-2">
          <Label htmlFor="emailOrUsername">Email or Username</Label>
          <Input
            id="emailOrUsername"
            type="text"
            {...register('emailOrUsername')}
            autoComplete="username"
            disabled={isSubmitting}
            placeholder="Enter your email or username"
            aria-required="true"
            aria-invalid={!!errors.emailOrUsername}
            aria-describedby={errors.emailOrUsername ? 'email-error' : undefined}
          />
          {errors.emailOrUsername && <p className="mt-1 text-xs text-destructive">{errors.emailOrUsername.message}</p>}
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            autoComplete="current-password"
            disabled={isSubmitting}
            placeholder="Enter your password"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Forgot your password?
        </Link>
      </div>

      <p className="mt-5 text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-sm text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Create one
        </Link>
      </p>
    </div>
  );
};
