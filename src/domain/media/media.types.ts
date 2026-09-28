import type { media } from '../../db/schema.ts';

export type NewMedia = typeof media.$inferInsert;
export type Media = typeof media.$inferSelect;
