import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import { CategoryController } from './category.controller.ts';

export const categoryRouter = Router();
export const adminCategoryRouter = Router();

categoryRouter.get('/', CategoryController.listPublicCategories);
categoryRouter.get('/:id', CategoryController.retrievePublicCategory);

adminCategoryRouter.get('/', requirePermission('category', 'view'), CategoryController.listAdminCategories);
adminCategoryRouter.get('/:id', requirePermission('category', 'view'), CategoryController.retrieveAdminCategory);
adminCategoryRouter.post('/', requirePermission('category', 'create'), CategoryController.createCategory);
adminCategoryRouter.patch('/:id', requirePermission('category', 'update'), CategoryController.updateCategory);
adminCategoryRouter.delete('/:id', requirePermission('category', 'delete'), CategoryController.softDeleteCategory);