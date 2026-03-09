import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@life-manager/schema';

export function useRegisterForm() {
  return useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });
}
