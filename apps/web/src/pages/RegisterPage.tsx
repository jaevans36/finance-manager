import React from 'react';
import styled from 'styled-components';
import { RegisterForm } from '../components/auth/RegisterForm';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
`;

const FormCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 40px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  box-shadow: 0 2px 10px ${({ theme }) => theme.colors.shadow};
  width: 100%;
  max-width: 500px;
`;

export const RegisterPage = () => {
  return (
    <PageContainer>
      <FormCard>
        <RegisterForm />
      </FormCard>
    </PageContainer>
  );
};
