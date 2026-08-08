import { z } from 'zod';
import type { Response } from 'express';

import { logger } from '../lib/logger.ts';
import env from '../../env.ts';

import type { PaginatedResult } from '../shared/types/index.ts';

export function preparePaginatedResponse<T>(
  result: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    items: result,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function respond<T extends z.ZodType>(res: Response, schema: T, data: z.input<T>, status = 200) {
  const result = schema.safeParse(data);

  if (!result.success) {
    logger.error({ issues: result.error.issues, status: 500 }, 'Response schema violation');

    if (env.NODE_ENV !== 'production') {
      throw new Error(`Response failed schema validation: ${result.error.message}`);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(status).json(result.data);
}
