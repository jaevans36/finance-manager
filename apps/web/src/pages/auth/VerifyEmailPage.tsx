import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setVerified(true);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to verify email. The link may be invalid or expired.'));
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle size={40} />
            </div>
            <CardTitle className="text-center text-2xl">Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Your email has been successfully verified. You can now access all features of your account.
            </p>
            <Alert variant="success">
              <AlertDescription>
                Your account is now fully activated. You can log in and start using the application.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle size={40} />
          </div>
          <CardTitle className="text-center text-2xl">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 text-center">
            <Link to="/resend-verification" className="font-medium text-primary no-underline hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Resend verification email
            </Link>
            <Link to="/login" className="font-medium text-primary no-underline hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Return to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
