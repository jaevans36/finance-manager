import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';

interface StatisticCardProps {
  label: string;
  value: number | string;
  valueColor?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export const StatisticCard = ({ 
  label, 
  value, 
  valueColor,
  trend 
}: StatisticCardProps) => {
  return (
    <Card className="p-5 text-center relative transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2">
      <span className="block mb-2 font-semibold uppercase text-body-sm tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        className="text-[42px] font-bold text-primary my-2.5 transition-all duration-300"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {trend && (
        <span
          className={cn(
            'flex items-center justify-center gap-1 font-medium mt-2',
            trend.direction === 'up' && 'text-success',
            trend.direction === 'down' && 'text-destructive',
            trend.direction === 'neutral' && 'text-muted-foreground'
          )}
        >
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
          {trend.value}
        </span>
      )}
    </Card>
  );
};
