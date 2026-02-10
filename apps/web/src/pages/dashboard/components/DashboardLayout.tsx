import styled from 'styled-components';
import { mediaQueries } from '@finance-manager/ui/styles';

export const DashboardLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;

  ${mediaQueries.tablet} {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;
