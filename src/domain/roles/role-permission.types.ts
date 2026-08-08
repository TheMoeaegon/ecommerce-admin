import { z } from 'zod';

import type {
  createRoleResponseSchema,
  createRoleBodySchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
} from './role-permssion.schema.ts';
import type { rolePermissions, roles } from '../../db/schema.ts';

export type CreateRoleDTO = z.infer<typeof createRoleBodySchema>;
export type CreateRoleResponse = z.infer<typeof createRoleResponseSchema>;

export type GetRolesResponse = z.infer<typeof getRolesResponseSchema>;
export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;

export type NewRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferInsert;
