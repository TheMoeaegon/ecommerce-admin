import { Router } from 'express';

import { requirePermission } from '../../middleware/auth.ts';
import * as ProductController from './product.controller.ts';
import { createUploadMiddleware } from '../../utils/media.ts';

export const productRouter = Router();
export const adminProductRouter = Router();

//products TODO
productRouter.get('/', ProductController.listPublicProducts); // TODO
productRouter.get('/:id', ProductController.retrievePublicProduct); // products TODO

adminProductRouter.get('/', requirePermission('product', 'view'), ProductController.listAdminProducts); // products TODO
adminProductRouter.get('/:id', requirePermission('product', 'view'), ProductController.retrieveAdminProduct); // don't forget to send availability in repsonse.
adminProductRouter.post('/', requirePermission('product', 'create'), ProductController.createProduct);
adminProductRouter.patch('/:id', requirePermission('product', 'update'), ProductController.updateProduct); // products TODO
adminProductRouter.delete('/:id', requirePermission('product', 'delete'), ProductController.softDeleteProduct); // products TODO

//product media
adminProductRouter.post('/:id/media', createUploadMiddleware('product-media', [{ name: 'media', maxCount: 5 }]), requirePermission('product', 'update'), ProductController.attachProductMedia);
adminProductRouter.patch('/:productId/media/:mediaId', requirePermission('product', 'update'), ProductController.updateProductMedia);
adminProductRouter.delete('/:productId/media/:mediaId', requirePermission('product', 'update'), ProductController.removeProductMedia);

adminProductRouter.post('/:id/attributes', requirePermission('product', 'update'), ProductController.createProductAttribute);
adminProductRouter.delete('/:productId/attributes/:attributeId', requirePermission('product', 'update'), ProductController.removeProductAttribute); //attributes TODO

adminProductRouter.get('/:id/attributes/combinations/price', requirePermission('product', 'view'), ProductController.getAttributeCombinationPrice);
adminProductRouter.post('/:id/attributes/combinations', requirePermission('product', 'update'), ProductController.createAttributeCombination);
adminProductRouter.post('/:id/attributes/combinations/:combinationId/media', requirePermission('product', 'update'), ProductController.attachProductMediaToCombination);
adminProductRouter.delete('/:id/attributes/combinations/:combinationId', requirePermission('product', 'update'), ProductController.removeAttributeCombination); // TODO

// specification TODO

// related products TODO
