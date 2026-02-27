interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  headerAction,
}: ChartCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground m-0">{title}</h3>
          {subtitle && <span className="block mt-1 text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        {headerAction && headerAction}
      </div>
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  );
};
