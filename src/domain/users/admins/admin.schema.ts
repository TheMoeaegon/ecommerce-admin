import { createSelectSchema } from 'drizzle-zod';

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
