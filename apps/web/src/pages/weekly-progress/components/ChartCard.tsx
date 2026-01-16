import styled from 'styled-components';
import { Card, TextSmall } from '../../../components/ui';

const ChartSection = styled(Card)`
  padding: 20px;
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const ChartSubtitle = styled(TextSmall)`
  display: block;
  margin-top: 4px;
`;

const ChartContent = styled.div`
  width: 100%;
  height: 100%;
`;

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
    <ChartSection>
      <ChartHeader>
        <div>
          <ChartTitle>{title}</ChartTitle>
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </div>
        {headerAction && headerAction}
      </ChartHeader>
      <ChartContent>
        {children}
      </ChartContent>
    </ChartSection>
  );
};
