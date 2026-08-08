import type { SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema.ts';

export interface QueryFilter {
  where?: SQL;
  orderBy?: SQL[];
  limit?: number;
  offset?: number;
}

export type DB = NodePgDatabase<typeof schema>;
