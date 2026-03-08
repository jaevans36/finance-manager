import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskGroupSchema, type CreateTaskGroupInput } from '@life-manager/schema';

export function useTaskGroupForm(defaultValues?: Partial<CreateTaskGroupInput>) {
  return useForm<CreateTaskGroupInput>({
    resolver: zodResolver(createTaskGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      colour: '#6366f1',
      ...defaultValues,
    },
  });
}
