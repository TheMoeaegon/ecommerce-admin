import { z } from 'zod';

export const paginatedSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.coerce.number(),
    totalPages: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
