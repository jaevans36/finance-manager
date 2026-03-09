import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { useForgotPasswordForm } from '../../hooks/forms';
import type { ForgotPasswordInput } from '@life-manager/schema';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForgotPasswordForm();

  const onSubmit = async (data: ForgotPasswordInput) => {
    setApiError('');

    try {
      await authService.requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'Failed to send reset email'));
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              We&apos;ve sent password reset instructions to <strong>{submittedEmail}</strong>
            </p>
            <Alert variant="success">
              <AlertDescription>
                If an account exists with this email, you will receive a password reset link shortly.
                The link will expire in 1 hour.
              </AlertDescription>
            </Alert>
            <div className="text-center">
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
          <CardTitle className="text-center text-2xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <div className="mb-4 space-y-2">
              <Input
                id="email-address"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.email.message}</AlertDescription>
                </Alert>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>
            <div className="mt-4 text-center">
              <Link to="/login" className="font-medium text-primary no-underline hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
