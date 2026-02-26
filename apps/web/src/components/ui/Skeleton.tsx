import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

export const Skeleton = styled.div<{ width?: string; height?: string; borderRadius?: string }>`
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.border} 0%,
    ${props => props.theme.colors.inputBorder} 50%,
    ${props => props.theme.colors.border} 100%
  );
  background-size: 468px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  border-radius: ${props => props.borderRadius || '4px'};
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '16px'};
`;

export const SkeletonLine = styled(Skeleton)`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const SkeletonCircle = styled(Skeleton)`
  border-radius: 50%;
  width: ${props => props.width || '40px'};
  height: ${props => props.height || props.width || '40px'};
`;
