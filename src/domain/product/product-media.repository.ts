import db from '../../db/connection.ts';

import type { ProductMediaItem } from './product-media.types.ts';
import type { DB } from '../../shared/types/index.ts';
import { productMedia } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

export async function setMediaForProduct(productId: number, items: ProductMediaItem[], executor: DB = db) {}

export async function addMediaToProduct(productId: number, items: ProductMediaItem[], executor: DB = db) {
  try {
    return await executor.insert(productMedia).values(items).returning();
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_media_product_id_products: { status: 'badRequest', message: `The product with id "${productId}" does not exist.` },
      fk_product_media_media_id_media: { status: 'badRequest', message: `One or more media do not exist: ${items.map(i => i.mediaId).join(', ')}.` },
      product_media_product_id_media_id: { status: 'conflict', message: `One or more media are already attached to product "${productId}": ${items.map(i => i.mediaId).join(', ')}.` },
      product_media_one_primary_per_product: { status: 'badRequest', message: 'A product can only have one primary media.' },
    });
  }
}

export async function removeMediaFromProduct(productId: number, mediaIds: number[], executor: DB = db) {}

export async function getMediaByProduct(productId: number, executor: DB = db) {}

export async function setPrimaryMedia(productId: number, mediaId: number, executor: DB = db) {}

const ProductMediaRepository = {
  setMediaForProduct,
  addMediaToProduct,
  removeMediaFromProduct,
  getMediaByProduct,
  setPrimaryMedia,
};

export default ProductMediaRepository;
