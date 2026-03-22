import { useShortcutContext } from '../../providers/KeyboardShortcutProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '../../lib/utils';

interface ShortcutCheatSheetProps {
  open: boolean;
  onClose: () => void;
}

function formatKey(key: string) {
  return key.split('+').map(k => {
    if (k === 'Space') return '␣';
    if (k === 'Escape') return 'Esc';
    return k.toUpperCase();
  }).join(' then ');
}

export function ShortcutCheatSheet({ open, onClose }: ShortcutCheatSheetProps) {
  const { shortcuts } = useShortcutContext();
  const groups = [...new Set(shortcuts.map(s => s.group))];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent role="dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {groups.map(group => (
            <div key={group}>
              <p className="mb-2 font-medium text-muted-foreground">{group}</p>
              <div className="space-y-1">
                {shortcuts.filter(s => s.group === group).map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span>{s.description}</span>
                    <kbd className={cn(
                      'rounded border bg-muted px-1.5 py-0.5 font-mono text-xs'
                    )}>{formatKey(s.key)}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
