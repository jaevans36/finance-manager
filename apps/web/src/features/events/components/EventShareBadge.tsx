import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventShareBadgeProps {
  shareCount: number;
  className?: string;
}

export function EventShareBadge({ shareCount, className }: EventShareBadgeProps) {
  if (shareCount === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary',
        className,
      )}
      title={`Shared with ${shareCount} ${shareCount === 1 ? 'person' : 'people'}`}
    >
      <Users size={11} />
      Shared
    </span>
  );
}
