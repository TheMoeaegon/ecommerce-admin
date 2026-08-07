import { z } from 'zod';

import type { createRoleSchema, getRolesQuerySchema, getRolesResponseSchema } from './role-permssion.schema.ts';
import type { roles } from '../../db/schema.ts';

export type CreateRoleDTO = z.infer<typeof createRoleSchema>;

export type GetRolesResponse = z.infer<typeof getRolesResponseSchema>;
export type GetRolesQuery = z.infer<typeof getRolesQuerySchema>;

export type NewRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;
