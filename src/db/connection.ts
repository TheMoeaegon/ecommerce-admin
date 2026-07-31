import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.ts';
import { env } from '../../env.ts';

const createPool = () => {
  return new Pool({
    connectionString: env.DATABASE_URL,
  });
};

let client = createPool();

export const db = drizzle({ client });
export default db;
