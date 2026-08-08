import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { roles } from '../../db/schema.ts';
import { paginatedSchema, paginationQuerySchema } from '../../shared/schemas/index.ts';

export const roleSchema = createSelectSchema(roles);
export const permissionIdSchema = z
  .number({ error: 'Permission ID must be a number' })
  .int()
  .positive()
  .describe('ID of an existing permission');

export const createRoleBodySchema = createInsertSchema(roles, {
  name: z.string().min(1).describe('Role name (must be unique)'),
})
  .omit({ id: true, createdAt: true })
  .extend({
    permissions: z.array(permissionIdSchema).min(1).describe('IDs of permissions to grant to the role'),
  });

export const createRoleResponseSchema = roleSchema;

export const getRolesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().describe('Case-insensitive match on role name'),
});
export const getRolesResponseSchema = paginatedSchema(roleSchema);
