import { Skeleton, SkeletonLine, SkeletonCircle } from '../ui/Skeleton';

interface TaskSkeletonProps {
  count?: number;
}

export const TaskSkeleton = ({ count = 3 }: TaskSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-3 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            <SkeletonCircle width="20px" height="20px" />
            <SkeletonLine width="60%" height="20px" />
          </div>
          <div className="flex flex-col gap-2">
            <SkeletonLine width="90%" height="14px" />
            <SkeletonLine width="75%" height="14px" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-xl" />
            <Skeleton className="h-6 w-[100px] rounded-xl" />
            <Skeleton className="h-6 w-[60px] rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
};
