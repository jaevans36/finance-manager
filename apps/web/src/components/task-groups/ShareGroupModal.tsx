import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Eye } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { taskGroupSharingService, type GroupShare, type SharePermission } from '../../services/taskGroupSharingService';
import { cn } from '../../lib/utils';

interface ShareGroupModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export const ShareGroupModal = ({ groupId, groupName, onClose }: ShareGroupModalProps) => {
  const toast = useToast();
  const [shares, setShares] = useState<GroupShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('View');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [groupId]);

  const loadShares = async () => {
    try {
      setIsLoading(true);
      const data = await taskGroupSharingService.getShares(groupId);
      setShares(data);
    } catch {
      // Silently ignore — list will just be empty
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const share = await taskGroupSharingService.shareGroup(groupId, {
        usernameOrEmail: usernameOrEmail.trim(),
        permission,
      });
      setShares(prev => {
        const existing = prev.findIndex(s => s.sharedWithUserId === share.sharedWithUserId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = share;
          return updated;
        }
        return [...prev, share];
      });
      setUsernameOrEmail('');
      toast.success(`Shared with ${share.username}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to share group';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (sharedUserId: string, username: string) => {
    try {
      await taskGroupSharingService.unshareGroup(groupId, sharedUserId);
      setShares(prev => prev.filter(s => s.sharedWithUserId !== sharedUserId));
      toast.success(`Removed ${username}'s access`);
    } catch {
      toast.error('Failed to remove share');
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Share "${groupName}"`}>
      {/* Add share form */}
      <form onSubmit={handleShare} className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Add person
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={usernameOrEmail}
            onChange={e => setUsernameOrEmail(e.target.value)}
            placeholder="Username or email"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={permission}
            onChange={e => setPermission(e.target.value as SharePermission)}
            className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="View">View</option>
            <option value="Edit">Edit</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting || !usernameOrEmail.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus size={15} />
            Share
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </form>

      {/* Permission legend */}
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye size={12} />
          View — can see tasks only
        </span>
        <span className="flex items-center gap-1">
          <Shield size={12} />
          Edit — can create and update tasks
        </span>
      </div>

      {/* Current shares */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          {isLoading ? 'Loading…' : shares.length === 0 ? 'Not shared with anyone yet' : `Shared with ${shares.length} ${shares.length === 1 ? 'person' : 'people'}`}
        </p>
        {shares.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {shares.map(share => (
              <li key={share.sharedWithUserId} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {share.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{share.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{share.email}</p>
                </div>
                <span className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-xs font-medium',
                  share.permission === 'Edit'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {share.permission}
                </span>
                <button
                  onClick={() => handleRemove(share.sharedWithUserId, share.username)}
                  className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Remove access"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};
