import type { productMedia } from '../../db/schema.ts';

export type ProductMedia = typeof productMedia.$inferSelect;

export type ProductMediaItem = typeof productMedia.$inferInsert;
