import type { SQL } from 'drizzle-orm';

export interface QueryFilter {
  where?: SQL;
  orderBy?: SQL[];
  limit: number;
  offset?: number;
}
