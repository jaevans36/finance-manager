import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.resendVerificationEmail(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend verification email'));
    } finally {
      setIsSubmitting(false);
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
              We&apos;ve sent a new verification email to <strong>{email}</strong>
            </p>
            <Alert variant="success">
              <AlertDescription>
                Please check your inbox and click the verification link. The link will expire in 24 hours.
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
          <CardTitle className="text-center text-2xl">Resend Verification Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-muted-foreground">
            Enter your email address and we&apos;ll send you a new verification link.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="mb-4 space-y-2">
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending...' : 'Resend verification email'}
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

export default ResendVerificationPage;
