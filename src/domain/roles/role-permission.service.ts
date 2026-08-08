import { and, ilike, inArray } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { permissions, roles } from '../../db/schema.ts';
import { PermissionRepository, RolePermissionRepository, RoleRepository } from './role-permission.repository.ts';
import { preparePaginatedResponse } from '../../utils/response.ts';
import { BadRequestError } from '../../shared/errors.ts';

import type { QueryFilter } from '../../shared/types/index.ts';
import type {
  CreateRoleDTO,
  CreateRoleResponse,
  GetRolesQuery,
  GetRolesResponse,
  RolePermission,
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

  static async createRole({ name, permissions: permissionArray }: CreateRoleDTO): Promise<CreateRoleResponse> {
    const options: QueryFilter = {
      where: and(permissionArray ? inArray(permissions.id, permissionArray) : undefined),
    };

    const existingPermissions = await PermissionRepository.findMany(options);
    const foundIds = new Set(existingPermissions.map(p => p.id));
    const missingIds = permissionArray.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestError(`Permission ID(s) not found: ${missingIds.join(', ')}`);
    }

    const exisitingRole = await RoleRepository.findByName(name);

    if (exisitingRole) {
      throw new BadRequestError(`Role with role name:${name} already exists.`);
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
}
