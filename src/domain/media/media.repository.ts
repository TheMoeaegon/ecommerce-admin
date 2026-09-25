import { eq, inArray } from 'drizzle-orm';

import db from '../../db/connection.ts';
import { media } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type { DB } from '../../shared/types/index.ts';
import type { Media, NewMedia } from './media.types.ts';

export async function create(m: NewMedia, executor: DB = db) {
  const [newMedia] = await executor.insert(media).values(m).returning();
  return newMedia;
}

export async function createMany(items: NewMedia[], executor: DB = db) {
  return await executor.insert(media).values(items).returning();
}

export async function findById(id: number, executor: DB = db): Promise<Media | undefined> {
  return undefined;
}

export async function update(id: number, patch: Partial<NewMedia>, executor: DB = db): Promise<Media | undefined> {
  const [updated] = await executor.update(media).set(patch).where(eq(media.id, id)).returning();
  return updated;
}

export async function deleteByIds(ids: number[], executor: DB = db): Promise<Media[]> {
  try {
    return await executor.delete(media).where(inArray(media.id, ids)).returning();
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_media_media_id_media: { status: 'badRequest', message: `One or more media are attached to a product and cannot be deleted: ${ids.join(', ')}.` },
      fk_brands_picture_id_media: { status: 'badRequest', message: `One or more media are used by a brand and cannot be deleted: ${ids.join(', ')}.` },
      fk_manufacturers_picture_id_media: { status: 'badRequest', message: `One or more media are used by a manufacturer and cannot be deleted: ${ids.join(', ')}.` },
      fk_categories_picture_id_media: { status: 'badRequest', message: `One or more media are used by a category and cannot be deleted: ${ids.join(', ')}.` },
    });
  }
}

export async function findByIds(ids: number[], executor: DB = db): Promise<Media[]> {
  return [];
}
