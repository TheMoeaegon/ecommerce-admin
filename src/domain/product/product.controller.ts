import type { Request, Response } from 'express';

import { respond } from '../../utils/response.ts';
import { createProductBodySchema, createProductResponseSchema } from './product.schema.ts';
import productService from './product.service.ts';

export const listPublicProducts = async (_req: Request, res: Response) => {};

export const retrievePublicProduct = async (_req: Request, res: Response) => {};

export const listAdminProducts = async (_req: Request, res: Response) => {};

export const retrieveAdminProduct = async (_req: Request, res: Response) => {};

export const createProduct = async (req: Request, res: Response) => {
  const body = createProductBodySchema.parse(req.body);

  const newProduct = await productService.createProduct(body);

  return res.status(201).json(newProduct);
};

export const updateProduct = async (_req: Request, res: Response) => {};

export const softDeleteProduct = async (_req: Request, res: Response) => {};

export const attachProductMedia = async (_req: Request, res: Response) => {};

export const removeProductMedia = async (_req: Request, res: Response) => {};

export const attachProductTags = async (_req: Request, res: Response) => {};

export const removeProductTag = async (_req: Request, res: Response) => {};

export const createProductAttribute = async (_req: Request, res: Response) => {};

export const createProductAttributeValue = async (_req: Request, res: Response) => {};

export const removeProductAttribute = async (_req: Request, res: Response) => {};

export const createProductCombination = async (_req: Request, res: Response) => {};

export const removeProductCombination = async (_req: Request, res: Response) => {};

const ProductController = {
  listPublicProducts,
  retrievePublicProduct,
  listAdminProducts,
  retrieveAdminProduct,
  createProduct,
  updateProduct,
  softDeleteProduct,
  attachProductMedia,
  removeProductMedia,
  attachProductTags,
  removeProductTag,
  createProductAttribute,
  createProductAttributeValue,
  removeProductAttribute,
  createProductCombination,
  removeProductCombination,
};

export default ProductController;
