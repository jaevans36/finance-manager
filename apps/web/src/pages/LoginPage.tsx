import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { CenteredContainer, FormCard } from '../components/ui';

export const LoginPage = () => {
  return (
    <CenteredContainer>
      <FormCard>
        <LoginForm />
      </FormCard>
    </CenteredContainer>
  );
};
