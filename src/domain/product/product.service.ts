import { ensureSlugIsUnique, ensureSkuIsUnique, validateProductCreate } from './product.validation.ts';
import { ProductRepository } from './product.repository.ts';

import type { CreateProductDTO, CreateProductResponse, NewProduct } from './product.types.ts';

export class ProductService {
  static async createProduct(payload: CreateProductDTO): Promise<CreateProductResponse> {
    validateProductCreate(payload);

    const existingBySlug = await ProductRepository.findBySlug(payload.slug);
    ensureSlugIsUnique(existingBySlug, payload.slug);

    if (payload.sku) {
      const existingBySku = await ProductRepository.findBySku(payload.sku);
      ensureSkuIsUnique(existingBySku, payload.sku);
    }

    const newProduct: NewProduct = {
      ...payload,
      price: String(payload.price),
      oldPrice: payload.oldPrice == undefined ? undefined : String(payload.oldPrice),
    };

    return await ProductRepository.insert(newProduct);
  }
}
