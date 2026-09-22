import { z } from 'zod';

import type {
  attachProductMediaResponseSchema,
  createProductBodySchema,
  createProductResponseSchema,
  updateProductMediaBodySchema,
  updateProductMediaResponseSchema,
} from './product.schema.ts';
import type { products } from '../../db/schema.ts';

export type CreateProductDTO = z.infer<typeof createProductBodySchema>;
export type CreateProductResponse = z.infer<typeof createProductResponseSchema>;

export type AttachProductMediaResponse = z.infer<typeof attachProductMediaResponseSchema>;

export type UpdateProductMediaDTO = z.infer<typeof updateProductMediaBodySchema>;
export type UpdateProductMediaResponse = z.infer<typeof updateProductMediaResponseSchema>;

export type NewProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
