import { ProductRepository } from './product.repository.ts';

import type { CreateProductDTO, CreateProductResponse, NewProduct } from './product.types.ts';

export class ProductService {
  static async createProduct(payload: CreateProductDTO): Promise<CreateProductResponse> {
    const newProduct: NewProduct = {
      ...payload,
      price: String(payload.price),
      oldPrice: payload.oldPrice === undefined ? undefined : String(payload.oldPrice),
    };

    return await ProductRepository.insert(newProduct);
  }
}
