import { z } from 'zod';

// Re-export auth schemas for backward compatibility
export { loginSchema, registerSchema } from './authSchemas';
export type { LoginInput, RegisterInput } from './authSchemas';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
