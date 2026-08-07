import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { roles } from '../../db/schema.ts';
import { paginatedSchema, paginationQuerySchema } from '../../shared/schemas/index.ts';

export const createRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const roleSchema = createSelectSchema(roles);

export const getRolesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().describe('Case-insensitive match on role name'),
});
export const getRolesResponseSchema = paginatedSchema(roleSchema);
