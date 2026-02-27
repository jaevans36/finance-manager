import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, updateEventSchema, type CreateEventInput, type UpdateEventInput } from '@finance-manager/schema';

export function useCreateEventForm(defaultValues?: Partial<CreateEventInput>) {
  return useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      isAllDay: false,
      location: '',
      reminderMinutes: undefined,
      groupId: '',
      ...defaultValues,
    },
  });
}

export function useEditEventForm(defaultValues?: Partial<UpdateEventInput>) {
  return useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
    defaultValues,
  });
}
