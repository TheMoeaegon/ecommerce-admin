import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import * as ProductController from './product.controller.ts';
import { createUploadMiddleware } from '../../utils/media.ts';

export const productRouter = Router();
export const adminProductRouter = Router();

//products
productRouter.get('/', ProductController.listPublicProducts);
productRouter.get('/:id', ProductController.retrievePublicProduct);

adminProductRouter.get('/', requirePermission('product', 'view'), ProductController.listAdminProducts);
adminProductRouter.get('/:id', requirePermission('product', 'view'), ProductController.retrieveAdminProduct); // don't forget to send availability in repsonse.
adminProductRouter.post('/', requirePermission('product', 'create'), ProductController.createProduct);
adminProductRouter.patch('/:id', requirePermission('product', 'update'), ProductController.updateProduct);
adminProductRouter.delete('/:id', requirePermission('product', 'delete'), ProductController.softDeleteProduct);

//product media
adminProductRouter.post('/:id/media', createUploadMiddleware('product-media', [{ name: 'media', maxCount: 5 }]), requirePermission('product', 'update'), ProductController.attachProductMedia);
adminProductRouter.patch('/:productId/media/:mediaId', requirePermission('product', 'update'), ProductController.updateProductMedia);
adminProductRouter.delete('/:productId/media/:mediaId', requirePermission('product', 'update'), ProductController.removeProductMedia);

//attributes TODO
adminProductRouter.post('/:id/attributes', requirePermission('product', 'update'), ProductController.createProductAttribute);
adminProductRouter.delete('/:productId/attributes/:attributeId', requirePermission('product', 'update'), ProductController.removeProductAttribute);

adminProductRouter.post('/:id/combinations', requirePermission('product', 'update'), ProductController.createProductCombination);
adminProductRouter.delete('/:productId/combinations/:combinationId', requirePermission('product', 'update'), ProductController.removeProductCombination);

// specification TODO

// related products TODO
