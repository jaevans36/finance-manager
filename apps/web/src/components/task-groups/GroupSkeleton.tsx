import styled from 'styled-components';
import { SkeletonLine } from '../ui/Skeleton';

const SkeletonItem = styled.div`
  padding: 12px 16px;
  margin-bottom: 4px;
`;

interface GroupSkeletonProps {
  count?: number;
}

export const GroupSkeleton = ({ count = 4 }: GroupSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index}>
          <SkeletonLine width="70%" height="16px" />
        </SkeletonItem>
      ))}
    </>
  );
};
