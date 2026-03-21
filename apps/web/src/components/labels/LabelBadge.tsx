import { cn } from '../../lib/utils';
import type { Label } from '../../services/labelsService';

interface LabelBadgeProps {
  label: Label;
  className?: string;
}

export function LabelBadge({ label, className }: LabelBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white', className)}
      style={{ backgroundColor: label.colourHex }}
      title={label.name}
    >
      {label.name}
    </span>
  );
}
