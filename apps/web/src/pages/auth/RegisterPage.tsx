
import { RegisterForm } from '../../components/auth/RegisterForm';
import { CenteredContainer, FormCard } from '@finance-manager/ui';

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
