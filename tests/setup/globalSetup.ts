import { execSync } from 'node:child_process';
import { db } from '../../src/db/connection.ts';
import { sql } from 'drizzle-orm';

export default async function setup() {
  console.log('🗄️  Setting up test database...');
  try {
    // Drop all tables if they exist to ensure clean state
    // Order: Drop dependent tables first, then independent ones
    // Respecting CASCADE and FK constraints

    // await db.execute(sql`DROP TABLE IF EXISTS mfa_trust CASCADE`);
    // Use drizzle-kit CLI to push schema to database
    console.log('🚀 Pushing schema using drizzle-kit...');
    execSync(
      `npx drizzle-kit push --url="${process.env.DATABASE_URL}" --schema="./src/db/schema.ts" --dialect="postgresql"`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      }
    );

    console.log('✅ Test database setup complete');
  } catch (err) {
    console.error('❌ Error setting up test database:', err);
    throw err;
  }
  return async () => {
    try {
      console.log('🧹 Tearing down test database...');

      // like this drop all the table
      // await db.execute(sql`DROP TABLE IF EXISTS mfa_trust CASCADE`);

      console.log('✅ Test database teardown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error clearing up test database:', err);
      throw err;
    }
  };
}
