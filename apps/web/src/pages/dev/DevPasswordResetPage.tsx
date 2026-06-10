import { useState } from 'react';
import { Link } from 'react-router-dom';
import { devService } from '../../services/devService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const DevPasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await devService.resetPassword(email, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Password reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success">
              <AlertDescription>
                Password reset successfully. You can now{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  log in
                </Link>{' '}
                with your new password.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Dev: Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Dev mode only — this page does not exist in production.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevPasswordResetPage;
