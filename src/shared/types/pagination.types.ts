import { z } from 'zod';
import type { paginationQuerySchema } from '../schemas/pagination.schema.ts';

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginatedRow = { total: number };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
