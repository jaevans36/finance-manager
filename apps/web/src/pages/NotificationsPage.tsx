import { Bell } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  usePendingInvitations,
} from '@/hooks/queries';
import { InvitationCard } from '@/features/sharing/components/InvitationCard';
import type { NotificationType } from '@/services/notificationService';

const TYPE_LABELS: Record<NotificationType, string> = {
  TaskAssigned: 'assigned you a task',
  TaskUnassigned: 'unassigned a task',
  TaskCompletedByAssignee: 'completed an assigned task',
  EventShareInvitation: 'shared an event with you',
  EventShareAccepted: 'accepted your event share',
  EventShareDeclined: 'declined your event share',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const NotificationsPage = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: pendingInvitations = [] } = usePendingInvitations();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageLayout title="Notifications">
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pending invitations
            </h2>
            <div className="space-y-2">
              {pendingInvitations.map((share) => (
                <InvitationCard key={share.id} share={share} />
              ))}
            </div>
          </section>
        )}

        {/* Notifications list */}
        <section>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Bell size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40',
                    !notification.isRead && 'bg-primary/5',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {notification.entityTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{notification.fromUsername} {TYPE_LABELS[notification.type]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-auto py-0.5 text-xs"
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
};

export default NotificationsPage;
