import { and, eq, inArray } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { productCategories, products, productTags } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type { NewProduct, Product } from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export async function findBySlug(slug: string, executor: DB = db) {
  const [product] = await executor.select({ id: products.id }).from(products).where(eq(products.slug, slug));
  return product;
}

export async function findBySku(sku: string, executor: DB = db) {
  const [product] = await executor.select({ id: products.id }).from(products).where(eq(products.sku, sku));
  return product;
}

export async function insert(payload: NewProduct, executor: DB = db): Promise<Product> {
  try {
    const [product] = await executor.insert(products).values(payload).returning();
    return product;
  } catch (err) {
    return translateConstraintError(err, {
      products_slug_unique: { status: 'conflict', message: `A product with slug "${payload.slug}" already exists.` },
      products_sku_unique: { status: 'conflict', message: `A product with SKU "${payload.sku}" already exists.` },
      fk_products_brand_id_brands: { status: 'badRequest', message: 'The referenced brand does not exist.' },
      fk_products_manufacturer_id_manufacturers: { status: 'badRequest', message: 'The referenced manufacturer does not exist.' },
    });
  }
}

export async function findBasePrice(productId: number, executor: DB = db): Promise<string | undefined> {
  const [product] = await executor.select({ price: products.price }).from(products).where(eq(products.id, productId));
  return product?.price;
}

export async function existsById(productId: number, executor: DB = db): Promise<boolean> {
  const [product] = await executor.select({ id: products.id }).from(products).where(eq(products.id, productId));
  return product !== undefined;
}

export async function findByIdWithMedia(productId: number, executor: DB = db) {}

// ------------------------------ Categories ------------------------------ //

export async function addCategories(productId: number, categoryIds: number[], executor: DB = db) {
  try {
    await executor
      .insert(productCategories)
      .values(categoryIds.map(categoryId => ({ productId, categoryId })))
      .onConflictDoNothing();
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_categories_product_id_products: { status: 'badRequest', message: `The product with id "${productId}" does not exist.` },
      fk_product_categories_category_id_categories: { status: 'badRequest', message: `One or more category do not exist.: ${categoryIds.join(', ')}.` },
    });
  }
}

export async function removeCategories(productId: number, categoryIds: number[], executor: DB = db) {
  //only call this after checking category id lenght
  await executor.delete(productCategories).where(and(eq(productCategories.productId, productId), inArray(productCategories.categoryId, categoryIds)));
}

export async function setCategories(productId: number, categoryIds: number[], executor: DB = db) {
  //only call this after checking category id lenght
  await executor.delete(productCategories).where(eq(productCategories.productId, productId));
  await addCategories(productId, categoryIds, executor);
}

// -------------------------------- Tags -------------------------------- //

export async function addTags(productId: number, tagIds: number[], executor: DB = db) {
  try {
    await executor
      .insert(productTags)
      .values(tagIds.map(tagId => ({ productId, tagId })))
      .onConflictDoNothing();
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_tags_product_id_products: { status: 'badRequest', message: `The product with id "${productId}" does not exist.` },
      fk_product_tags_tag_id_tags: { status: 'badRequest', message: `One or more tag IDs do not exist: ${tagIds.join(', ')}.` },
    });
  }
}

export async function removeTags(productId: number, tagIds: number[], executor: DB = db) {
  //only call this after checking tagsId id length
  await executor.delete(productTags).where(and(eq(productTags.productId, productId), inArray(productTags.tagId, tagIds)));
}

export async function setTags(productId: number, tagIds: number[], executor: DB = db) {
  //only call this after checking category id lenght
  await executor.delete(productTags).where(eq(productTags.productId, productId));
  await addTags(productId, tagIds, executor);
}
