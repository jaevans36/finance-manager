import styled from 'styled-components';

export const DashboardLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;
