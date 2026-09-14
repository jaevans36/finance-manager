import { useState } from 'react';
import { LockIcon, EditIcon, XIcon } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { useChangePasswordForm } from '../../hooks/forms';
import type { ChangePasswordInput } from '@life-manager/schema';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getErrorMessage } from '../../utils/errorHelpers';

export function ChangePasswordSection() {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useChangePasswordForm();

  const handleCancel = () => {
    setEditing(false);
    setApiError('');
    reset();
  };

  const onSubmit = async (data: ChangePasswordInput) => {
    setApiError('');
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      setEditing(false);
      reset();
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'Failed to change password'));
    }
  };

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground md:text-body-sm">
        <LockIcon size={20} />
        Password
      </div>
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pl-7 md:pl-0">
          {apiError && <p className="text-xs text-destructive">{apiError}</p>}
          <div>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              {...register('currentPassword')}
              disabled={isSubmitting}
              className="w-64 md:w-full"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="New password (min. 8 characters)"
              {...register('newPassword')}
              disabled={isSubmitting}
              className="w-64 md:w-full"
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              disabled={isSubmitting}
              className="w-64 md:w-full"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="default" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleCancel} disabled={isSubmitting}>
              <XIcon size={16} />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 pl-7 md:flex-wrap md:gap-2 md:pl-0">
          <span className="text-base font-medium text-foreground">••••••••</span>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground transition-all hover:border-primary hover:bg-accent hover:text-primary [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            <EditIcon />
            Change
          </button>
        </div>
      )}
    </div>
  );
}
