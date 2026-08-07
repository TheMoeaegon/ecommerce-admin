import { eq, sql } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { permissions, rolePermissions, roles } from '../../db/schema.ts';
import { BaseRepository } from '../../shared/base.repository.ts';

import type { NewRole } from './role-permission.types.ts';
import type { QueryFilter } from '../../shared/types/index.ts';

export class RoleRepository extends BaseRepository {
  static async findMany(options?: QueryFilter) {
    const qb = db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
        total: sql<number>`count(*) over()`,
      })
      .from(roles)
      .$dynamic();

    const qb2 = db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .$dynamic();

    const [items, [{ count }]] = await Promise.all([
      this.applyQueryOptions(qb, options).execute(),
      this.applyQueryOptions(qb2, { where: options?.where }).execute(),
    ]);

    return { items, count };
  }

  static async findById() {}

  static async findRolesPermissions() {
    return await db
      .select({
        roleName: roles.name,
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(roles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId));
  }

  static async insert(newRole: NewRole) {
    const [role] = await db.insert(roles).values(newRole).returning();
    return role;
  }

  static async delete(id: number) {
    const [deletedRole] = await db.delete(roles).where(eq(roles.id, id)).returning();
    return deletedRole;
  }
}

export class PermissionRepository {
  async findAll() {
    return await db.select().from(permissions);
  }
}

export class RolePermissionRepository {
  static async create() {}
}
