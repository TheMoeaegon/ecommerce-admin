import { Router } from 'express';

import '../shared/docs/index.ts'; // import docs

import { healthRouter } from './health.route.ts';
import { openapiRouter } from './openapi.route.ts';
import { rolePermissionRouter } from '../domain/roles/index.ts';
import { requireAuth } from '../middleware/auth.ts';
import { userRouter } from '../domain/users/users.routes.ts';
import { adminProductRouter, productRouter } from '../domain/product/product.routes.ts';
import { adminBrandRouter, brandRouter } from '../domain/brands/brand.routes.ts';
import { adminManufacturerRouter, manufacturerRouter } from '../domain/manufacturers/manufacturer.routes.ts';
import { adminCategoryRouter, categoryRouter } from '../domain/category/category.routes.ts';

const router = Router();

router.use(healthRouter);
router.use(openapiRouter);

router.use('/roles', requireAuth, rolePermissionRouter);
router.use('/users', requireAuth, userRouter);

router.use('/products', productRouter);
router.use('/admin/products', requireAuth, adminProductRouter);

router.use('/brands', brandRouter);
router.use('/admin/brands', requireAuth, adminBrandRouter);

router.use('/manufacturers', manufacturerRouter);
router.use('/admin/manufacturers', requireAuth, adminManufacturerRouter);

router.use('/categories', categoryRouter);
router.use('/admin/categories', requireAuth, adminCategoryRouter);

export default router;
