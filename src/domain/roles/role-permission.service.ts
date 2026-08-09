import { and, ilike, inArray } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { permissions, roles } from '../../db/schema.ts';
import { PermissionRepository, RolePermissionRepository, RoleRepository } from './role-permission.repository.ts';
import { preparePaginatedResponse } from '../../utils/response.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors.ts';

import type { QueryFilter } from '../../shared/types/index.ts';
import type {
  CreateRoleDTO,
  CreateRoleResponse,
  GetRolePermissionResponse,
  GetRolesQuery,
  GetRolesResponse,
  ListPermissionsResponse,
  Role,
  RolePermission,
  UpdateRoleDTO,
  UpdateRoleRoleResponse,
} from './role-permission.types.ts';

export class RoleService {
  static async listRoles({ page, pageSize, search: roleName }: GetRolesQuery): Promise<GetRolesResponse> {
    const offset = (page - 1) * pageSize;

    const options: QueryFilter = {
      limit: pageSize,
      offset,
      where: and(roleName ? ilike(roles.name, `%${roleName}%`) : undefined),
    };

    const { items, count } = await RoleRepository.findMany(options);

    return preparePaginatedResponse(items, count, page, pageSize);
  }

  static async listPermissions(): Promise<ListPermissionsResponse> {
    const permissions = await PermissionRepository.findMany();
    return { items: permissions };
  }

  static async createRole({ name, permissions: permissionArray }: CreateRoleDTO): Promise<CreateRoleResponse> {
    const exisitingRole = await RoleRepository.findByName(name);

    if (exisitingRole) {
      throw new BadRequestError(`Role with role name:${name} already exists.`);
    }

    if (permissionArray && permissionArray.length > 0) {
      const existingPermissions = await PermissionRepository.findMany({
        where: inArray(permissions.id, permissionArray),
      });

      const foundIds = new Set(existingPermissions.map(p => p.id));
      const missingIds = permissionArray.filter(id => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new BadRequestError(`Permission ID(s) not found: ${missingIds.join(', ')}`);
      }
    }

    const result = await db.transaction(async tx => {
      const newRole = await RoleRepository.insert({ name }, tx);
      if (permissionArray && permissionArray.length > 0) {
        const rolePermissionValues: RolePermission[] = permissionArray.map(pid => ({
          permissionId: pid,
          roleId: newRole.id,
        }));

        await RolePermissionRepository.insertMany(rolePermissionValues, tx);
      }
      return newRole;
    });
    return result;
  }

  static async getRolePermissionById(roleId: number): Promise<GetRolePermissionResponse> {
    const exisitingRole = await RoleRepository.findById(roleId);

    if (!exisitingRole) {
      throw new NotFoundError(`Role with id:${roleId} doesn't exists.`);
    }

    return await RolePermissionRepository.findByRoleId(roleId);
  }

  static async deleteRolePermission(roleId: number) {
    await db.transaction(async tx => {
      const deletedRole = await RoleRepository.delete(roleId, tx);

      if (!deletedRole) {
        throw new NotFoundError(`Role with id:${roleId} doesn't exists.`);
      }

      await RolePermissionRepository.deleteByRoleId(roleId, tx);
    });
  }

  static async updateRole(roleId: number, { name, permissions: permissionArray }: UpdateRoleDTO): Promise<UpdateRoleRoleResponse> {
    const existingRole = await RoleRepository.findById(roleId);

    if (!existingRole) {
      throw new NotFoundError(`Role with role id:${roleId} doesn't exists.`);
    }

    if (permissionArray && permissionArray.length > 0) {
      const existingPermissions = await PermissionRepository.findMany({
        where: inArray(permissions.id, permissionArray),
      });

      const foundIds = new Set(existingPermissions.map(p => p.id));
      const missingIds = permissionArray.filter(id => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new BadRequestError(`Permission ID(s) not found: ${missingIds.join(', ')}`);
      }
    }

    const result = await db.transaction(async tx => {
      if (permissionArray) {
        await RolePermissionRepository.deleteByRoleId(roleId, tx);
        const rolePermissionValues: RolePermission[] = [...new Set(permissionArray)].map(pid => ({
          permissionId: pid,
          roleId: existingRole.id,
        }));

        if (rolePermissionValues.length > 0) {
          await RolePermissionRepository.insertMany(rolePermissionValues, tx);
        }
      }

      if (!name) {
        return existingRole;
      }

      const role = await RoleRepository.update(roleId, { name }, tx);
      return role;
    });
    return result;
  }
}
