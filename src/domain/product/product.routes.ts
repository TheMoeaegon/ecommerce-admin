import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import ProductController from './product.controller.ts';

export const productRouter = Router();
export const adminProductRouter = Router();

productRouter.get('/', ProductController.listPublicProducts);
productRouter.get('/:id', ProductController.retrievePublicProduct);

adminProductRouter.get('/', requirePermission('product', 'view'), ProductController.listAdminProducts);
adminProductRouter.get('/:id', requirePermission('product', 'view'), ProductController.retrieveAdminProduct); // don't forget to send availability in repsonse.
adminProductRouter.post('/', requirePermission('product', 'create'), ProductController.createProduct);
adminProductRouter.patch('/:id', requirePermission('product', 'update'), ProductController.updateProduct);
adminProductRouter.delete('/:id', requirePermission('product', 'delete'), ProductController.softDeleteProduct);

adminProductRouter.post('/:id/media', requirePermission('product', 'update'), ProductController.attachProductMedia);
adminProductRouter.delete('/:productId/media/:mediaId', requirePermission('product', 'update'), ProductController.removeProductMedia);

adminProductRouter.post('/:id/tags', requirePermission('product', 'update'), ProductController.attachProductTags);
adminProductRouter.delete('/:productId/tags/:tagId', requirePermission('product', 'update'), ProductController.removeProductTag);

adminProductRouter.post('/:id/attributes', requirePermission('product', 'update'), ProductController.createProductAttribute);
adminProductRouter.post('/:productId/attributes/:attributeId/values', requirePermission('product', 'update'), ProductController.createProductAttributeValue);
adminProductRouter.delete('/:productId/attributes/:attributeId', requirePermission('product', 'update'), ProductController.removeProductAttribute);

adminProductRouter.post('/:id/combinations', requirePermission('product', 'update'), ProductController.createProductCombination);
adminProductRouter.delete('/:productId/combinations/:combinationId', requirePermission('product', 'update'), ProductController.removeProductCombination);
