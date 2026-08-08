import type { Request, Response } from 'express';

import {
  createRoleBodySchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
  removeRolePermissionParamsSchema,
  retrieveRolePermissionParamsSchema,
  retrieveRolePermissionResponseSchema,
  roleSchema,
  updateRoleBodySchema,
  updateRoleParamsSchema,
  updateRoleResponseSchema,
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

  static async retrieveRolePermission(req: Request, res: Response) {
    const { id } = retrieveRolePermissionParamsSchema.parse(req.params);

    const result = await RoleService.getRolePermissionById(id);

    return respond(res, retrieveRolePermissionResponseSchema, result);
  }

  static async removeRolePermission(req: Request, res: Response) {
    const { id } = removeRolePermissionParamsSchema.parse(req.params);

    await RoleService.deleteRolePermission(id);

    return res.status(204).send();
  }

  static async updateRole(req: Request, res: Response) {
    const body = updateRoleBodySchema.parse(req.body);
    const { id } = updateRoleParamsSchema.parse(req.params);

    const result = await RoleService.updateRole(id, body);

    respond(res, updateRoleResponseSchema, result);
  }
}
