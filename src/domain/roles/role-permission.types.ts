import { z } from 'zod';

import type {
  createRoleResponseSchema,
  createRoleBodySchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
  retrieveRolePermissionResponseSchema,
  updateRoleBodySchema,
  updateRoleResponseSchema,
  listPermissionsResponseSchema,
} from './role-permssion.schema.ts';
import type { rolePermissions, roles } from '../../db/schema.ts';

export type CreateRoleDTO = z.infer<typeof createRoleBodySchema>;
export type CreateRoleResponse = z.infer<typeof createRoleResponseSchema>;

export type GetRolesResponse = z.infer<typeof getRolesResponseSchema>;
export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;

export type ListPermissionsResponse = z.infer<typeof listPermissionsResponseSchema>;

export type GetRolePermissionResponse = z.infer<typeof retrieveRolePermissionResponseSchema>;

export type UpdateRoleDTO = z.infer<typeof updateRoleBodySchema>;
export type UpdateRoleRoleResponse = z.infer<typeof updateRoleResponseSchema>;

export type NewRole = typeof roles.$inferInsert;
export type UpdateRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferInsert;
