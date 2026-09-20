import { ensureSlugIsUnique, ensureSkuIsUnique, validateProductCreate } from './product.validation.ts';
import productRepository from './product.repository.ts';
import db from '../../db/connection.ts';

import type { CreateProductDTO, CreateProductResponse, NewProduct } from './product.types.ts';

export async function createProduct(payload: CreateProductDTO): Promise<CreateProductResponse> {
  validateProductCreate(payload);

  const existingBySlug = await productRepository.findBySlug(payload.slug);
  ensureSlugIsUnique(existingBySlug, payload.slug);

  if (payload.sku) {
    const existingBySku = await productRepository.findBySku(payload.sku);
    ensureSkuIsUnique(existingBySku, payload.sku);
  }

  const newProduct: NewProduct = {
    ...payload,
    price: String(payload.price),
    oldPrice: payload.oldPrice == undefined ? undefined : String(payload.oldPrice),
  };

  return await db.transaction(async tx => {
    const { categoryIds, tagIds } = payload;
    const product = await productRepository.insert(newProduct, tx);

    if (categoryIds.length > 0) {
      await productRepository.addCategories(product.id, categoryIds, tx);
    }

    if (tagIds.length > 0) {
      await productRepository.addTags(product.id, tagIds, tx);
    }

    return { ...product, categoryIds, tagIds };
  });
}

const ProductService = { createProduct };

export default ProductService;
