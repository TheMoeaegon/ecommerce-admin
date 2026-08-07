import type { PgSelect } from 'drizzle-orm/pg-core';
import type { QueryFilter } from '../shared/types/dbOptions.types.ts';

export class BaseRepository {
  protected static applyQueryOptions<T extends PgSelect>(qb: T, options?: QueryFilter) {
    if (!options) return qb;

    const { limit, offset, where, orderBy } = options;
    if (where) qb = qb.where(where) as typeof qb;
    if (orderBy?.length) qb = qb.orderBy(...orderBy) as typeof qb;
    if (limit) qb = qb.limit(limit) as typeof qb;
    if (offset) qb = qb.offset(offset) as typeof qb;

    return qb;
  }
}
