import type { Request, Response } from 'express';

import { respond } from '../../utils/response.ts';
import {
  attachProductMediaParamsSchema,
  attachProductMediaResponseSchema,
  computeAttributeCombinationPriceBodySchema,
  computeAttributeCombinationPriceResponseSchema,
  createAttributeCombinationBodySchema,
  createAttributeCombinationParamsSchema,
  createAttributeCombinationResponseSchema,
  createProductAttributeBodySchema,
  createProductAttributeParamsSchema,
  createProductAttributeResponseSchema,
  createProductBodySchema,
  removeProductMediaParamsSchema,
  updateProductMediaBodySchema,
  updateProductMediaParamsSchema,
  updateProductMediaResponseSchema,
} from './product.schema.ts';

import * as productAttributeService from './product-attribute.service.ts';
import * as productService from './product.service.ts';

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

export const attachProductMedia = async (req: Request, res: Response) => {
  const { id } = attachProductMediaParamsSchema.parse(req.params);
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined)?.media ?? [];

  const result = await productService.addProductMedia(id, files);

  return respond(res, attachProductMediaResponseSchema, result, 201);
};

export const removeProductMedia = async (req: Request, res: Response) => {
  const { productId, mediaId } = removeProductMediaParamsSchema.parse(req.params);

  await productService.removeProductMedia(productId, mediaId);

  return res.status(204).send();
};

export const updateProductMedia = async (req: Request, res: Response) => {
  const { productId, mediaId } = updateProductMediaParamsSchema.parse(req.params);
  const body = updateProductMediaBodySchema.parse(req.body);

  const result = await productService.updateProductMedia(productId, mediaId, body);

  return respond(res, updateProductMediaResponseSchema, result, 200);
};

export const attachProductTags = async (_req: Request, res: Response) => {};

export const removeProductTag = async (_req: Request, res: Response) => {};

export const createProductAttribute = async (req: Request, res: Response) => {
  const { id } = createProductAttributeParamsSchema.parse(req.params);
  const body = createProductAttributeBodySchema.parse(req.body);

  const result = await productAttributeService.createAttribute(id, body);

  return res.status(201).json(result);
};

export const removeProductAttribute = async (_req: Request, res: Response) => {};

export const getAttributeCombinationPrice = async (req: Request, res: Response) => {
  const { id } = createAttributeCombinationParamsSchema.parse(req.params);
  const { values } = computeAttributeCombinationPriceBodySchema.parse(req.body);

  const result = await productAttributeService.computeAttributeCombinationPrice(id, values);

  return respond(res, computeAttributeCombinationPriceResponseSchema, result, 200);
};

export const createAttributeCombination = async (req: Request, res: Response) => {
  const { id } = createAttributeCombinationParamsSchema.parse(req.params);
  const body = createAttributeCombinationBodySchema.parse(req.body);

  const result = await productAttributeService.createAttributeCombination(id, body);

  return respond(res, createAttributeCombinationResponseSchema, result, 201);
};

export const attachProductMediaToCombination = async (req: Request, res: Response) => {
  const { id } = attachProductMediaParamsSchema.parse(req.params);
  const files = (req.files as Record<string, Express.Multer.File[]> | undefined)?.media ?? [];

  const result = await productService.addProductMedia(id, files);

  return respond(res, attachProductMediaResponseSchema, result, 201);
};

export const removeAttributeCombination = async (_req: Request, res: Response) => {};
