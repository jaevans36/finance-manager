import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from '@life-manager/schema';

export function useForgotPasswordForm() {
  return useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
}

export function useResetPasswordForm() {
  return useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
}

export function useChangePasswordForm() {
  return useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
}
