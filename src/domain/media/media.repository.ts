import db from '../../db/connection.ts';
import { eq } from 'drizzle-orm';
import { media } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type { NewMedia } from './media.types.ts';
import type { DB } from '../../shared/types/index.ts';

export async function create(m: NewMedia, executor: DB = db) {
  const [newMedia] = await executor.insert(media).values(m).returning();
  return newMedia;
}

export async function createMany(items: NewMedia[], executor: DB = db) {
  return await executor.insert(media).values(items).returning();
}

export async function findById(id: number, executor: DB = db) {}

export async function deleteById(id: number, executor: DB = db) {
  try {
    await executor.delete(media).where(eq(media.id, id));
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_media_media_id_media: { status: 'badRequest', message: `Media with id "${id}" is attached to a product and cannot be deleted.` },
      fk_brands_picture_id_media: { status: 'badRequest', message: `Media with id "${id}" is used by a brand and cannot be deleted.` },
      fk_manufacturers_picture_id_media: { status: 'badRequest', message: `Media with id "${id}" is used by a manufacturer and cannot be deleted.` },
      fk_categories_picture_id_media: { status: 'badRequest', message: `Media with id "${id}" is used by a category and cannot be deleted.` },
    });
  }
}

export async function findByIds(ids: number[], executor: DB = db) {}

const MediaRepository = {
  create,
  createMany,
  findById,
  delete: deleteById,
  findByIds,
};

export default MediaRepository;
