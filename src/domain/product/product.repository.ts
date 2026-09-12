import db from '../../db/connection.ts';

import type { NewProduct, Product } from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export class ProductRepository {
  static async insert(payload: NewProduct, executor: DB = db): Promise<Product> {
    throw new Error('ProductRepository.insert is not implemented yet');
  }
}
