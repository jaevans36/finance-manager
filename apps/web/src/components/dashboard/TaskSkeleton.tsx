import styled from 'styled-components';
import { Skeleton, SkeletonLine, SkeletonCircle } from '../ui/Skeleton';

const SkeletonCard = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const SkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

interface TaskSkeletonProps {
  count?: number;
}

export const TaskSkeleton: React.FC<TaskSkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index}>
          <SkeletonHeader>
            <SkeletonCircle width="20px" height="20px" />
            <SkeletonLine width="60%" height="20px" />
          </SkeletonHeader>
          <SkeletonContent>
            <SkeletonLine width="90%" height="14px" />
            <SkeletonLine width="75%" height="14px" />
          </SkeletonContent>
          <SkeletonFooter>
            <Skeleton width="80px" height="24px" borderRadius="12px" />
            <Skeleton width="100px" height="24px" borderRadius="12px" />
            <Skeleton width="60px" height="24px" borderRadius="12px" />
          </SkeletonFooter>
        </SkeletonCard>
      ))}
    </>
  );
};
