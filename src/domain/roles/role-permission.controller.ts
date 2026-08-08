import type { Request, Response } from 'express';

import {
  createRoleBodySchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
  roleSchema,
} from './role-permssion.schema.ts';
import { RoleService } from './role-permission.service.ts';
import { respond } from '../../utils/response.ts';

export class RoleController {
  static async listRoles(req: Request, res: Response) {
    const query = getRolesQuerySchema.parse(req.query);

    const result = await RoleService.listRoles(query);

    return respond(res, getRolesResponseSchema, result);
  }

  static async createRole(req: Request, res: Response) {
    const body = createRoleBodySchema.parse(req.body);

    const result = await RoleService.createRole(body);

    return respond(res, roleSchema, result, 201);
  }
}
