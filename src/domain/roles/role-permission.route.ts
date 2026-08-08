import { Router } from 'express';
import { RoleController } from './role-permission.controller.ts';

export const rolePermissionRouter = Router();

rolePermissionRouter.get('/', RoleController.listRoles);
rolePermissionRouter.post('/', RoleController.createRole);
