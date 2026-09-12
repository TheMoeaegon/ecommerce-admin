import type { Request, Response } from 'express';

import { respond } from '../../utils/response.ts';
import { createProductBodySchema, createProductResponseSchema } from './product.schema.ts';
import { ProductService } from './product.service.ts';

export class ProductController {
  static async listPublicProducts(req: Request, res: Response) {}

  static async retrievePublicProduct(req: Request, res: Response) {}

  static async listAdminProducts(req: Request, res: Response) {}

  static async retrieveAdminProduct(req: Request, res: Response) {}

  static async createProduct(req: Request, res: Response) {
    const body = createProductBodySchema.parse(req.body);

    const result = await ProductService.createProduct(body);

    return respond(res, createProductResponseSchema, result, 201);
  }

  static async updateProduct(req: Request, res: Response) {}

  static async softDeleteProduct(req: Request, res: Response) {}

  static async attachProductMedia(req: Request, res: Response) {}

  static async removeProductMedia(req: Request, res: Response) {}

  static async attachProductTags(req: Request, res: Response) {}

  static async removeProductTag(req: Request, res: Response) {}

  static async createProductAttribute(req: Request, res: Response) {}

  static async createProductAttributeValue(req: Request, res: Response) {}

  static async removeProductAttribute(req: Request, res: Response) {}

  static async createProductCombination(req: Request, res: Response) {}

  static async removeProductCombination(req: Request, res: Response) {}
}
