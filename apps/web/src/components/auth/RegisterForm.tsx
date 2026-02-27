import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { CheckIcon, XCircleIcon } from 'lucide-react';
import { useRegisterForm } from '../../hooks/forms';
import type { RegisterInput } from '@finance-manager/schema';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useRegisterForm();
  const [apiError, setApiError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const watchedUsername = watch('username');
  const watchedPassword = watch('password');

  // Debounced username check
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3 || usernameToCheck.length > 20) {
      setUsernameAvailable(false);
      setUsernameMessage('Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(usernameToCheck)) {
      setUsernameAvailable(false);
      setUsernameMessage('Only letters, numbers, _ and - allowed');
      return;
    }

    try {
      setUsernameChecking(true);
      const result = await authService.checkUsername(usernameToCheck);
      setUsernameAvailable(result.available);
      setUsernameMessage(result.message);
    } catch {
      setUsernameAvailable(false);
      setUsernameMessage('Error checking username');
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!watchedUsername) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(watchedUsername);
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedUsername, checkUsernameAvailability]);

  const onFormSubmit = async (data: RegisterInput) => {
    setApiError('');

    // Additional async check: username must be available
    if (usernameAvailable === false) {
      setApiError(usernameMessage || 'Username is not available');
      return;
    }
    if (usernameAvailable === null) {
      setApiError('Please wait for username validation');
      return;
    }

    try {
      const response = await authService.register(data.email, data.username, data.password);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message || 'Registration failed. Please try again.');
      } else {
        setApiError('Registration failed. Please try again.');
      }
    }
  };

  const getPasswordStrength = (): string => {
    if (!watchedPassword) return '';
    if (watchedPassword.length < 8) return 'Weak';
    
    let strength = 0;
    if (/[A-Z]/.test(watchedPassword)) strength++;
    if (/[a-z]/.test(watchedPassword)) strength++;
    if (/[0-9]/.test(watchedPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) strength++;

    if (strength === 4) return 'Strong';
    if (strength >= 2) return 'Medium';
    return 'Weak';
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="mx-auto max-w-[400px] p-5">
      <h2 className="mb-5 text-foreground">Create Account</h2>
      
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="mb-4 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className={cn(errors.email && 'border-destructive')}
            disabled={isSubmitting}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              {...register('username')}
              className={cn(errors.username && 'border-destructive')}
              disabled={isSubmitting}
              placeholder="Choose a unique username"
            />
            {watchedUsername && !usernameChecking && usernameAvailable !== null && (
              <div className={cn(
                'absolute right-2 top-1/2 flex -translate-y-1/2 items-center',
                usernameAvailable ? 'text-success' : 'text-destructive',
              )}>
                {usernameAvailable ? <CheckIcon size={18} /> : <XCircleIcon size={18} />}
              </div>
            )}
          </div>
          {watchedUsername && usernameMessage && (
            <p className={cn(
              'mt-1 text-xs',
              usernameAvailable === true ? 'text-success' : 'text-muted-foreground',
            )}>
              {usernameMessage}
            </p>
          )}
          {errors.username && <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            className={cn(errors.password && 'border-destructive')}
            disabled={isSubmitting}
          />
          {watchedPassword && (
            <p className="mt-1 text-xs text-muted-foreground">
              Password strength: <strong className={cn(
                passwordStrength === 'Strong' && 'text-success',
                passwordStrength === 'Medium' && 'text-warning',
                passwordStrength === 'Weak' && 'text-destructive',
              )}>
                {passwordStrength}
              </strong>
            </p>
          )}
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="mb-4 space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={cn(errors.confirmPassword && 'border-destructive')}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      <Alert variant="default" className="mt-4 border-blue-200 bg-blue-50 text-sm text-muted-foreground dark:border-blue-800 dark:bg-blue-950">
        <AlertDescription>
          📧 A verification email will be sent to your email address after registration.
        </AlertDescription>
      </Alert>

      <p className="mt-5 text-center text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
};
