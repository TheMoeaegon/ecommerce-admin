import { eq, sql } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { permissions, rolePermissions, roles } from '../../db/schema.ts';
import { BaseRepository } from '../../shared/base.repository.ts';

import type { NewRole, RolePermission, UpdateRole } from './role-permission.types.ts';
import type { DB, QueryFilter } from '../../shared/types/index.ts';

export class RoleRepository extends BaseRepository {
  static async findMany(options?: QueryFilter) {
    const qb = db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .$dynamic();

    const qb2 = db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .$dynamic();

    const [items, [{ count }]] = await Promise.all([this.applyQueryOptions(qb, options).execute(), this.applyQueryOptions(qb2, { where: options?.where }).execute()]);

    return { items, count };
  }

  static async findById(id: number, executor: DB = db) {
    const [role] = await executor.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  static async findByName(name: string, executor: DB = db) {
    const [role] = await executor.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  static async insert(newRole: NewRole, executor: DB = db) {
    const [role] = await executor.insert(roles).values(newRole).returning();
    return role;
  }

  static async delete(id: number, executor: DB = db) {
    const [deletedRole] = await executor.delete(roles).where(eq(roles.id, id)).returning();
    return deletedRole;
  }

  static async update(id: number, body: UpdateRole, executor: DB = db) {
    const [role] = await executor.update(roles).set(body).where(eq(roles.id, id)).returning();
    return role;
  }
}

export class PermissionRepository extends BaseRepository {
  static async findMany(options?: QueryFilter, executor: DB = db) {
    const qb = executor.select().from(permissions).$dynamic();
    return await this.applyQueryOptions(qb, options).execute();
  }
}

export class RolePermissionRepository {
  static async insertMany(rolePermission: RolePermission[], executor: DB) {
    await executor.insert(rolePermissions).values(rolePermission);
  }

  static async findMany() {
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

  static async findByRoleId(roleId: number, executor: DB = db) {
    const [result] = await executor
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
        permissions: sql<{ id: number; resource: string; action: string }[]>`
          coalesce(
            json_agg(json_build_object('id', ${permissions.id}, 'resource', ${permissions.resource}, 'action', ${permissions.action}))
              FILTER (WHERE ${permissions.resource} IS NOT NULL),
            '[]'
          )
        `,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(roles.id, roleId))
      .groupBy(roles.id, roles.name);

    return result;
  }

  static async deleteByRoleId(roleId: number, executor: DB = db) {
    await executor.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }
}
