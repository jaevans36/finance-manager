import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserCheck, UserMinus, CheckCircle, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/queries';
import type { NotificationType } from '@/services/notificationService';

const TYPE_ICONS: Record<NotificationType, ReactNode> = {
  TaskAssigned: <UserCheck size={14} className="text-primary" />,
  TaskUnassigned: <UserMinus size={14} className="text-muted-foreground" />,
  TaskCompletedByAssignee: <CheckCircle size={14} className="text-success" />,
  EventShareInvitation: <Calendar size={14} className="text-primary" />,
  EventShareAccepted: <Calendar size={14} className="text-success" />,
  EventShareDeclined: <Calendar size={14} className="text-destructive" />,
};

const TYPE_LABELS: Record<NotificationType, string> = {
  TaskAssigned: 'assigned you a task',
  TaskUnassigned: 'unassigned a task',
  TaskCompletedByAssignee: 'completed an assigned task',
  EventShareInvitation: 'shared an event with you',
  EventShareAccepted: 'accepted your event share',
  EventShareDeclined: 'declined your event share',
};

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications({ pageSize: 5 });
  const markAllRead = useMarkAllNotificationsRead();

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-background shadow-lg"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="h-auto py-0.5 text-xs text-muted-foreground"
        >
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          You're all caught up
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 text-sm',
                !notification.isRead && 'bg-primary/5',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {TYPE_ICONS[notification.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{notification.entityTitle}</p>
                <p className="text-xs text-muted-foreground">
                  @{notification.fromUsername} {TYPE_LABELS[notification.type]}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(notification.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border px-4 py-2">
        <button
          onClick={handleViewAll}
          className="flex w-full items-center justify-between text-xs text-primary hover:underline"
        >
          View all notifications
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
