import { Calendar, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAcceptInvitation, useDeclineInvitation } from '@/hooks/queries';
import type { EventShare } from '@/services/sharingService';

interface InvitationCardProps {
  share: EventShare;
}

export function InvitationCard({ share }: InvitationCardProps) {
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();
  const isLoading = accept.isPending || decline.isPending;

  return (
    <Card className="flex items-center gap-4 px-4 py-3">
      <Calendar size={20} className="shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{share.eventId}</p>
        <p className="text-xs text-muted-foreground">
          Shared by @{share.username} &bull; {share.permission} access
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => decline.mutate(share.id)}
          disabled={isLoading}
          aria-label="Decline invitation"
        >
          {decline.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          Decline
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => accept.mutate(share.id)}
          disabled={isLoading}
          aria-label="Accept invitation"
        >
          {accept.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Accept
        </Button>
      </div>
    </Card>
  );
}
