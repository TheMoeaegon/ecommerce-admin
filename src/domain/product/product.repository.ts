import { eq } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { products } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type { NewProduct, Product } from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export class ProductRepository {
  static async findBySlug(slug: string, executor: DB = db) {
    const [product] = await executor.select({ id: products.id }).from(products).where(eq(products.slug, slug));
    return product;
  }

  static async findBySku(sku: string, executor: DB = db) {
    const [product] = await executor.select({ id: products.id }).from(products).where(eq(products.sku, sku));
    return product;
  }

  static async insert(payload: NewProduct, executor: DB = db): Promise<Product> {
    try {
      const [product] = await executor.insert(products).values(payload).returning();
      return product;
    } catch (err) {
      return translateConstraintError(err, {
        products_slug_unique: { status: 'conflict', message: `A product with slug "${payload.slug}" already exists.` },
        products_sku_unique: { status: 'conflict', message: `A product with SKU "${payload.sku}" already exists.` },
        products_price_non_negative: { status: 'badRequest', message: 'A product price cannot be negative. A product cannot be published without a price.' },
        products_old_price_non_negative: { status: 'badRequest', message: 'Old Price must be zero or greater' },
        products_rating_average_range: { status: 'badRequest', message: 'The rating average must be between 0 and 5.' },
        products_rating_count_non_negative: { status: 'badRequest', message: 'The rating count cannot be negative.' },
        products_available_to_after_from: { status: 'badRequest', message: 'availableTo must be after availableFrom.' },
        fk_products_brand_id_brands: { status: 'badRequest', message: 'The referenced brand does not exist.' },
        fk_products_manufacturer_id_manufacturers: { status: 'badRequest', message: 'The referenced manufacturer does not exist.' },
      });
    }
  }
}
