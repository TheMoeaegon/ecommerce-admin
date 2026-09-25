import db from '../../db/connection.ts';
import { and, eq, inArray } from 'drizzle-orm';

import type { ProductMedia, ProductMediaItem, ProductMediaWithMedia } from './product-media.types.ts';
import type { DB } from '../../shared/types/index.ts';
import { media, productMedia } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

export async function setMediaForProduct(productId: number, items: ProductMediaItem[], executor: DB = db): Promise<ProductMedia[]> {
  return [];
}

export async function addMediaToProduct(productId: number, items: ProductMediaItem[], executor: DB = db) {
  try {
    return await executor.insert(productMedia).values(items).returning();
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_media_product_id_products: { status: 'badRequest', message: `The product with id "${productId}" does not exist.` },
      fk_product_media_media_id_media: { status: 'badRequest', message: `One or more media do not exist: ${items.map(i => i.mediaId).join(', ')}.` },
      product_media_product_id_media_id: { status: 'conflict', message: `One or more media are already attached to product "${productId}": ${items.map(i => i.mediaId).join(', ')}.` },
    });
  }
}

export async function removeMediaFromProduct(productId: number, mediaIds: number[], executor: DB = db): Promise<ProductMedia[]> {
  return await executor
    .delete(productMedia)
    .where(and(eq(productMedia.productId, productId), inArray(productMedia.mediaId, mediaIds)))
    .returning();
}

export async function getAllMediaByProduct(productId: number, executor: DB = db): Promise<ProductMediaWithMedia[]> {
  return await executor
    .select({
      id: productMedia.id,
      productId: productMedia.productId,
      mediaId: productMedia.mediaId,
      displayOrder: productMedia.displayOrder,
      url: media.url,
      altText: media.altText,
      title: media.title,
    })
    .from(productMedia)
    .innerJoin(media, eq(productMedia.mediaId, media.id))
    .where(eq(productMedia.productId, productId));
}

export async function getMediaByProduct(productId: number, mediaId: number, executor: DB = db): Promise<ProductMediaWithMedia> {
  const [pm] = await executor
    .select({
      id: productMedia.id,
      productId: productMedia.productId,
      mediaId: productMedia.mediaId,
      displayOrder: productMedia.displayOrder,
      url: media.url,
      altText: media.altText,
      title: media.title,
    })
    .from(productMedia)
    .innerJoin(media, eq(productMedia.mediaId, media.id))
    .where(and(eq(productMedia.productId, productId), eq(productMedia.mediaId, mediaId)));
  return pm;
}

export async function updateDisplayOrder(productId: number, mediaId: number, displayOrder: number, executor: DB = db) {
  await executor
    .update(productMedia)
    .set({ displayOrder })
    .where(and(eq(productMedia.productId, productId), eq(productMedia.mediaId, mediaId)));
}
