import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { useResetPasswordForm } from '../../hooks/forms';
import type { ResetPasswordInput } from '@life-manager/schema';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useResetPasswordForm();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setApiError('Invalid reset link');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await authService.verifyResetToken(token);
        setTokenValid(result.valid);
        if (result.email) {
          setEmail(result.email);
        }
        if (!result.valid) {
          setApiError('This reset link is invalid or has expired');
        }
      } catch (err: unknown) {
        setApiError('Failed to verify reset link');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setApiError('');

    try {
      await authService.resetPassword(token!, data.password);
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please log in with your new password.' } 
      });
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'Failed to reset password'));
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Verifying reset link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-3 text-center">
              <Link to="/forgot-password" className="font-medium text-primary no-underline hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Request a new reset link
              </Link>
              <Link to="/login" className="font-medium text-primary no-underline hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Return to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Set new password</CardTitle>
        </CardHeader>
        <CardContent>
          {email && (
            <p className="mb-4 text-center text-muted-foreground">
              for <strong>{email}</strong>
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <div className="mb-4 space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="New password (min. 8 characters)"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="mb-4 space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Resetting password...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
