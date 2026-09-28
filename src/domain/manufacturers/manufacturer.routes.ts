import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import { ManufacturerController } from './manufacturer.controller.ts';

export const manufacturerRouter = Router();
export const adminManufacturerRouter = Router();

manufacturerRouter.get('/', ManufacturerController.listPublicManufacturers);
manufacturerRouter.get('/:id', ManufacturerController.retrievePublicManufacturer);

adminManufacturerRouter.get('/', requirePermission('manufacturer', 'view'), ManufacturerController.listAdminManufacturers);
adminManufacturerRouter.get('/:id', requirePermission('manufacturer', 'view'), ManufacturerController.retrieveAdminManufacturer);
adminManufacturerRouter.post('/', requirePermission('manufacturer', 'create'), ManufacturerController.createManufacturer);
adminManufacturerRouter.patch('/:id', requirePermission('manufacturer', 'update'), ManufacturerController.updateManufacturer);
adminManufacturerRouter.delete('/:id', requirePermission('manufacturer', 'delete'), ManufacturerController.softDeleteManufacturer);
