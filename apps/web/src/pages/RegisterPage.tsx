import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { CenteredContainer, FormCard } from '../components/ui';

const RegisterPage = () => {
  return (
    <CenteredContainer>
      <FormCard>
        <RegisterForm />
      </FormCard>
    </CenteredContainer>
  );
};

export default RegisterPage;
