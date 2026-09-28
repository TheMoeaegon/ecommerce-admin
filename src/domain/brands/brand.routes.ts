import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import { BrandController } from './brand.controller.ts';

export const brandRouter = Router();
export const adminBrandRouter = Router();

brandRouter.get('/', BrandController.listPublicBrands);
brandRouter.get('/:id', BrandController.retrievePublicBrand);

adminBrandRouter.get('/', requirePermission('brand', 'view'), BrandController.listAdminBrands);
adminBrandRouter.get('/:id', requirePermission('brand', 'view'), BrandController.retrieveAdminBrand);
adminBrandRouter.post('/', requirePermission('brand', 'create'), BrandController.createBrand);
adminBrandRouter.patch('/:id', requirePermission('brand', 'update'), BrandController.updateBrand);
adminBrandRouter.delete('/:id', requirePermission('brand', 'delete'), BrandController.softDeleteBrand);
