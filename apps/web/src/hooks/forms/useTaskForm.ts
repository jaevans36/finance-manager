import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, updateTaskSchema } from '@finance-manager/schema';
import type { CreateTaskInput, UpdateTaskInput } from '@finance-manager/schema';

export function useCreateTaskForm(defaultValues?: Partial<CreateTaskInput>) {
  return useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: '',
      groupId: '',
      ...defaultValues,
    },
  });
}

export function useEditTaskForm(defaultValues?: Partial<UpdateTaskInput>) {
  return useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: '',
      groupId: '',
      ...defaultValues,
    },
  });
}
