import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { CenteredContainer, FormCard } from '../components/ui';

export const RegisterPage = () => {
  return (
    <CenteredContainer>
      <FormCard>
        <RegisterForm />
      </FormCard>
    </CenteredContainer>
  );
};
