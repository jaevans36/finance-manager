import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
    description: z
      .string()
      .max(5000, 'Description must be 5000 characters or less')
      .optional()
      .or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isAllDay: z.boolean().optional(),
    location: z
      .string()
      .max(500, 'Location must be 500 characters or less')
      .optional()
      .or(z.literal('')),
    reminderMinutes: z.coerce
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional(),
    groupId: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export const updateEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
    description: z
      .string()
      .max(5000, 'Description must be 5000 characters or less')
      .nullable()
      .optional()
      .or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isAllDay: z.boolean().optional(),
    location: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .or(z.literal('')),
    reminderMinutes: z.coerce.number().int().nonnegative().nullable().optional(),
    groupId: z
      .string()
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
