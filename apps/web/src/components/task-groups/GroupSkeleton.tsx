import styled from 'styled-components';
import { SkeletonLine } from '../ui/Skeleton';

const SkeletonItem = styled.div`
  padding: 12px 16px;
  margin-bottom: 4px;
`;

interface GroupSkeletonProps {
  count?: number;
}

export const GroupSkeleton: React.FC<GroupSkeletonProps> = ({ count = 4 }) => {
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
