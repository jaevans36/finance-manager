import { useState } from 'react';
import { UserPlus, Trash2, Shield, Eye, Settings, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import {
  useEventShares,
  useCreateEventShare,
  useUpdateEventShare,
  useDeleteEventShare,
} from '@/hooks/queries';
import type { EventSharePermission } from '@/services/sharingService';
import { cn } from '@/lib/utils';

interface ShareEventModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const PERMISSION_OPTIONS: { value: EventSharePermission; label: string; icon: React.ReactNode }[] = [
  { value: 'View', label: 'View', icon: <Eye size={12} /> },
  { value: 'Edit', label: 'Edit', icon: <Shield size={12} /> },
  { value: 'Manage', label: 'Manage', icon: <Settings size={12} /> },
];

export function ShareEventModal({ eventId, eventTitle, onClose }: ShareEventModalProps) {
  const toast = useToast();
  const { data: shares = [], isLoading } = useEventShares(eventId);
  const createShare = useCreateEventShare(eventId);
  const updateShare = useUpdateEventShare(eventId);
  const deleteShare = useDeleteEventShare(eventId);

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [permission, setPermission] = useState<EventSharePermission>('View');
  const [error, setError] = useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = usernameOrEmail.trim();
    if (!value) return;
    setError(null);
    try {
      const share = await createShare.mutateAsync({ usernameOrEmail: value, permission });
      setUsernameOrEmail('');
      toast.success(`Shared with @${share.username}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to share event');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: EventSharePermission) => {
    try {
      await updateShare.mutateAsync({ shareId, request: { permission: newPermission } });
    } catch {
      toast.error('Failed to update permission');
    }
  };

  const handleRemove = async (shareId: string, username: string) => {
    try {
      await deleteShare.mutateAsync(shareId);
      toast.success(`Removed @${username}'s access`);
    } catch {
      toast.error('Failed to remove share');
    }
  };

  const isSubmitting = createShare.isPending;

  return (
    <Modal isOpen onClose={onClose} title={`Share "${eventTitle}"`}>
      {/* Add share form */}
      <form onSubmit={handleShare} className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-foreground">Add person</label>
        <div className="flex gap-2">
          <Input
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Username or email"
            className="flex-1"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as EventSharePermission)}
            className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERMISSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button
            type="submit"
            disabled={isSubmitting || !usernameOrEmail.trim()}
            className="gap-1.5"
            size="sm"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Share
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </form>

      {/* Permission legend */}
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye size={12} /> View — read only</span>
        <span className="flex items-center gap-1"><Shield size={12} /> Edit — can modify event</span>
        <span className="flex items-center gap-1"><Settings size={12} /> Manage — can share &amp; delete</span>
      </div>

      {/* Current shares */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          {isLoading
            ? 'Loading…'
            : shares.length === 0
            ? 'Not shared with anyone yet'
            : `Shared with ${shares.length} ${shares.length === 1 ? 'person' : 'people'}`}
        </p>
        {shares.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {shares.map((share) => (
              <li key={share.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {share.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">@{share.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{share.email}</p>
                </div>
                <select
                  value={share.permission}
                  onChange={(e) => handleUpdatePermission(share.id, e.target.value as EventSharePermission)}
                  className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label={`Permission for @${share.username}`}
                >
                  {PERMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-xs font-medium',
                  share.status === 'Pending' && 'bg-warning/15 text-warning',
                  share.status === 'Accepted' && 'bg-success/15 text-success',
                  share.status === 'Declined' && 'bg-muted text-muted-foreground',
                )}>
                  {share.status}
                </span>
                <button
                  onClick={() => handleRemove(share.id, share.username)}
                  className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title={`Remove @${share.username}'s access`}
                  aria-label={`Remove @${share.username}'s access`}
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
}
