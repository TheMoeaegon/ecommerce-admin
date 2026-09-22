import { Router } from 'express';
import { RoleController } from './role-permission.controller.ts';
import { requirePermission } from '../../middleware/auth.ts';

export const rolePermissionRouter = Router();

rolePermissionRouter.get('/', requirePermission('role', 'view'), RoleController.listRoles);
rolePermissionRouter.post('/', requirePermission('role', 'create'), RoleController.createRole);
rolePermissionRouter.get('/permissions', requirePermission('role', 'view'), RoleController.listPermissions);
rolePermissionRouter.get('/:id', requirePermission('role', 'view'), RoleController.retrieveRolePermission);
rolePermissionRouter.delete('/:id', requirePermission('role', 'delete'), RoleController.removeRolePermission);
rolePermissionRouter.put('/:id', requirePermission('role', 'update'), RoleController.updateRole);
