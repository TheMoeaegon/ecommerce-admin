import { sql } from 'drizzle-orm';

import db from '../src/db/connection.ts';

async function main() {
  const result = await db.execute(sql`SELECT 1`);
  console.log('✅ Connection successful:');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
