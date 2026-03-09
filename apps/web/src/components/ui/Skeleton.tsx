import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      {...props}
    />
  );
}

/** Convenience: a line-shaped skeleton with bottom margin */
function SkeletonLine({
  width,
  height = '16px',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string; height?: string }) {
  return (
    <Skeleton
      className={cn('mb-2 last:mb-0', className)}
      style={{ width, height }}
      {...props}
    />
  );
}

/** Convenience: a circular skeleton */
function SkeletonCircle({
  width = '40px',
  height,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string; height?: string }) {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width, height: height ?? width }}
      {...props}
    />
  );
}

export { Skeleton, SkeletonLine, SkeletonCircle };
