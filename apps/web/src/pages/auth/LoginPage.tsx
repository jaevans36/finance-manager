
import { LoginForm } from '../../components/auth/LoginForm';
import { CenteredContainer, FormCard } from '@finance-manager/ui';

const LoginPage = () => {
  return (
    <CenteredContainer>
      <FormCard>
        <LoginForm />
      </FormCard>
    </CenteredContainer>
  );
};

export default LoginPage;
