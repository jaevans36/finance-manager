
import { LoginForm } from '../components/auth/LoginForm';
import { CenteredContainer, FormCard } from '../components/ui';

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
