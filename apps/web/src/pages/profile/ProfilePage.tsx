import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { UserIcon, MailIcon, CalendarIcon, LogOutIcon, ArrowLeftIcon, EditIcon, CheckIcon, XIcon, DownloadIcon } from 'lucide-react';
import { useProfileForm } from '../../hooks/forms';
import { cn } from '../../lib/utils';

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Not available';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

const ProfilePage = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { register, watch, setValue, reset, formState: { errors: formErrors } } = useProfileForm();
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const watchedUsername = watch('username');
  const isTemporaryUsername = user?.username.startsWith('user_');

  useEffect(() => {
    if (!watchedUsername || watchedUsername === user?.username) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      if (watchedUsername.length < 3 || watchedUsername.length > 20) {
        setUsernameAvailable(false);
        setUsernameMessage('Username must be 3-20 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(watchedUsername)) {
        setUsernameAvailable(false);
        setUsernameMessage('Only letters, numbers, _ and - allowed');
        return;
      }

      try {
        setUsernameChecking(true);
        const result = await authService.checkUsername(watchedUsername);
        setUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch {
        setUsernameAvailable(false);
        setUsernameMessage('Error checking username');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedUsername, user?.username]);

  const handleEditUsername = () => {
    setValue('username', user?.username || '');
    setEditingUsername(true);
  };

  const handleCancelEdit = () => {
    setEditingUsername(false);
    reset({ username: '' });
    setUsernameAvailable(null);
    setUsernameMessage('');
  };

  const handleSaveUsername = async () => {
    if (!user || !usernameAvailable || !watchedUsername) return;

    try {
      setSaving(true);
      await authService.updateUsername(watchedUsername);
      
      // Update local user data
      const updatedUser = { ...user, username: watchedUsername.toLowerCase() };
      const token = localStorage.getItem('accessToken') || '';
      login(token, updatedUser);
      
      toast.success('Username updated successfully!');
      setEditingUsername(false);
      reset({ username: '' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update username';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      await authService.exportData();
      toast.success('Your data has been downloaded');
    } catch {
      toast.error('Failed to export data — please try again');
    } finally {
      setExporting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-2.5 md:w-[95%]">
      <div className="mb-8">
        <h1 className="font-display text-display tracking-tight text-foreground">Profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your account information</p>
      </div>

      <div className="mb-5 rounded-lg border border-border bg-card p-8 md:p-5">
        {/* Username Section */}
        <div className="mb-6 last:mb-0">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground md:text-body-sm">
            <UserIcon size={20} />
            Username {isTemporaryUsername && <span className="text-warning">(Temporary)</span>}
          </div>
          {editingUsername ? (
            <>
              <div className="flex items-center gap-2 pl-7 md:flex-wrap md:pl-0">
                <Input
                  type="text"
                  {...register('username')}
                  placeholder="Enter new username"
                  disabled={saving}
                  className="w-64 md:w-full"
                />
                <Button
                  variant="default"
                  onClick={handleSaveUsername}
                  disabled={saving || !usernameAvailable || usernameChecking}
                  size="sm"
                >
                  <CheckIcon size={16} />
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  size="sm"
                >
                  <XIcon size={16} />
                  Cancel
                </Button>
              </div>
              {watchedUsername && usernameMessage && (
                <div className={cn(
                  'mt-1 ml-7 text-xs md:ml-0',
                  usernameAvailable ? 'text-success' : 'text-destructive'
                )}>
                  {usernameMessage}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 pl-7 md:flex-wrap md:gap-2 md:pl-0">
              <span className="text-base font-medium text-foreground">@{user.username}</span>
              <button
                onClick={handleEditUsername}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground transition-all hover:border-primary hover:bg-accent hover:text-primary [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                <EditIcon />
                {isTemporaryUsername ? 'Set Username' : 'Edit'}
              </button>
            </div>
          )}
        </div>

        {/* Email Section */}
        <div className="mb-6 last:mb-0">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground md:text-body-sm">
            <MailIcon size={20} />
            Email Address
          </div>
          <div className="pl-7 text-base font-medium text-foreground md:pl-0 md:text-body-lg">{user.email}</div>
        </div>

        {/* Created At */}
        {user.createdAt && (
          <div className="mb-6 last:mb-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground md:text-body-sm">
              <CalendarIcon size={20} />
              Account Created
            </div>
            <div className="pl-7 text-base font-medium text-foreground md:pl-0 md:text-body-lg">{formatDate(user.createdAt)}</div>
          </div>
        )}

        {/* Last Login */}
        {user.lastLoginAt && (
          <div className="mb-6 last:mb-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground md:text-body-sm">
              <CalendarIcon size={20} />
              Last Login
            </div>
            <div className="pl-7 text-base font-medium text-foreground md:pl-0 md:text-body-lg">{formatDate(user.lastLoginAt)}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 md:flex-col">
          <Button variant="secondary" onClick={handleBackToDashboard}>
            <ArrowLeftIcon size={18} />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handleExportData} disabled={exporting}>
            <DownloadIcon size={18} />
            {exporting ? 'Exporting...' : 'Export my data'}
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOutIcon size={18} />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
