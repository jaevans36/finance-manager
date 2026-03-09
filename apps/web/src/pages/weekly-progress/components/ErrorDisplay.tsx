import { Button } from '../../../components/ui/button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  icon?: string;
}

export const ErrorDisplay = ({
  message,
  onRetry,
  title = 'Error Loading Data',
  icon = '⚠️',
}: ErrorDisplayProps) => {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-5">
      <h3 className="text-lg font-semibold text-destructive m-0 mb-2 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      <p className="text-sm text-foreground m-0">{message}</p>
      {onRetry && (
        <Button
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
