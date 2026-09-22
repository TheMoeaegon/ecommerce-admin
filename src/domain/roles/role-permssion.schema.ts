import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { permissions, roles } from '../../db/schema.ts';
import { paginatedSchema, paginationQuerySchema } from '../../shared/schemas/index.ts';

export const roleSchema = createSelectSchema(roles);
export const permissionSchema = createSelectSchema(permissions);

export const permissionIdSchema = z.number({ error: 'Permission ID must be a number' }).int().positive();
export const roleIdSchema = z.object({
  id: z.coerce.number({ error: 'Role ID must be a number' }).int('Role ID must be a integer number').positive('Role ID must be a positive number'),
});

export const createRoleBodySchema = createInsertSchema(roles, {
  name: z.string().min(1).describe('Role name (must be unique)'),
})
  .omit({ id: true, createdAt: true })
  .extend({
    permissions: z.array(permissionIdSchema).describe('IDs of permissions to grant to the role'),
  });
export const createRoleResponseSchema = roleSchema;

export const getRolesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional().describe('Case-insensitive match on role name'),
});
export const getRolesResponseSchema = paginatedSchema(roleSchema);

export const listPermissionsResponseSchema = z.object({
  items: z.array(permissionSchema),
});

export const retrieveRolePermissionParamsSchema = roleIdSchema;
export const retrieveRolePermissionResponseSchema = roleSchema.extend({
  permissions: z.array(permissionSchema),
});

export const removeRolePermissionParamsSchema = roleIdSchema;

export const updateRoleParamsSchema = roleIdSchema;
// prettier-ignore
export const updateRoleBodySchema = createRoleBodySchema
    .partial()
    .refine(data => Object.values(data).some(value => value !== undefined), { message: 'At least one field must be provided' });
export const updateRoleResponseSchema = roleSchema;
