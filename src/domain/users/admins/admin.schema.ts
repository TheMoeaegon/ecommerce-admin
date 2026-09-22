import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { user } from '../../../db/schema.ts';

export const userSchema = createSelectSchema(user);

export const retriveProfileResponseSchema = userSchema.omit({
  banExpires: true,
  banned: true,
  banReason: true,
  displayUsername: true,
  phoneNumberVerified: true,
  updatedAt: true,
  createdAt: true,
});

export const uploadProfileImageBodySchema = z.object({
  image: z.string().openapi({
    type: 'string',
    format: 'binary',
    description: 'Profile picture (JPEG, PNG or WebP, max 5MB)',
  }),
});
