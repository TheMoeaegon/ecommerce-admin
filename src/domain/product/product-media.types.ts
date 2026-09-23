import type { media, productMedia } from '../../db/schema.ts';

export type ProductMedia = typeof productMedia.$inferSelect;

export type ProductMediaItem = typeof productMedia.$inferInsert;

export type ProductMediaWithMedia = ProductMedia & Pick<typeof media.$inferSelect, 'url' | 'altText' | 'title'>;
