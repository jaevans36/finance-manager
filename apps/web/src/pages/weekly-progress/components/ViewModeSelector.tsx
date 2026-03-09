import { cn } from '../../../lib/utils';

type ViewMode = 'week' | 'month' | 'custom';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector = ({
  currentMode,
  onModeChange,
}: ViewModeSelectorProps) => {
  return (
    <div className="flex gap-2 items-center">
      {(['week', 'month', 'custom'] as const).map((mode) => (
        <button
          key={mode}
          className={cn(
            'px-3 py-1.5 border-none rounded text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md',
            currentMode === mode
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-foreground'
          )}
          onClick={() => onModeChange(mode)}
        >
          {mode === 'week' ? 'Week View' : mode === 'month' ? 'Month View' : 'Custom Range'}
        </button>
      ))}
    </div>
  );
};
