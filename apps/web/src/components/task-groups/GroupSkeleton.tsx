import { SkeletonLine } from '../ui/Skeleton';

interface GroupSkeletonProps {
  count?: number;
}

export const GroupSkeleton = ({ count = 4 }: GroupSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-1 px-4 py-3">
          <SkeletonLine width="70%" height="16px" />
        </div>
      ))}
    </>
  );
};
