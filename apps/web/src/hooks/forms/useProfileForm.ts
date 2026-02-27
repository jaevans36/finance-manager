import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUsernameSchema, type UpdateUsernameInput } from '@finance-manager/schema';

export function useProfileForm(defaultValues?: Partial<UpdateUsernameInput>) {
  return useForm<UpdateUsernameInput>({
    resolver: zodResolver(updateUsernameSchema),
    defaultValues: {
      username: '',
      ...defaultValues,
    },
    mode: 'onBlur',
  });
}
