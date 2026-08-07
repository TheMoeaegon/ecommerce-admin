import type { Request, Response } from 'express';

import { getRolesQuerySchema, getRolesResponseSchema } from './role-permssion.schema.ts';
import { RoleService } from './role-permission.service.ts';
import { respond } from '../../utils/response.ts';

export class RoleController {
  static async getAllRoles(req: Request, res: Response) {
    const query = getRolesQuerySchema.parse(req.query);

    const result = await RoleService.retriveAllRoles(query);

    return respond(res, getRolesResponseSchema, result);
  }
}
