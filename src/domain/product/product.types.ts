import { z } from 'zod';

import type { attachProductMediaResponseSchema, createProductBodySchema, createProductResponseSchema } from './product.schema.ts';
import type { products } from '../../db/schema.ts';

export type CreateProductDTO = z.infer<typeof createProductBodySchema>;
export type CreateProductResponse = z.infer<typeof createProductResponseSchema>;

export type AttachProductMediaResponse = z.infer<typeof attachProductMediaResponseSchema>;

export type NewProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
