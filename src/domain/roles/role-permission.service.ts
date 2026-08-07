import { and, ilike } from 'drizzle-orm';

import { roles } from '../../db/schema.ts';
import { RoleRepository } from './role-permission.repository.ts';
import { preparePaginatedResponse } from '../../utils/response.ts';

import type { QueryFilter } from '../../shared/types/index.ts';
import type { GetRolesQuery, GetRolesResponse } from './role-permission.types.ts';

export class RoleService {
  static async retriveAllRoles({ page, pageSize, search: roleName }: GetRolesQuery): Promise<GetRolesResponse> {
    const offset = (page - 1) * pageSize;

    const options: QueryFilter = {
      limit: pageSize,
      offset,
      where: and(roleName ? ilike(roles.name, `%${roleName}%`) : undefined),
    };

    const { items, count } = await RoleRepository.findMany(options);

    return preparePaginatedResponse(items, count, page, pageSize);
  }
}
