
import { RegisterForm } from '../../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
