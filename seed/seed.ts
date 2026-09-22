import { permissions, rolePermissions, roles, user } from '../src/db/schema.ts';
import { eq, sql } from 'drizzle-orm';

import db from '../src/db/connection.ts';
import { permissionRows } from '../src/lib/permission.ts';
import { auth } from '../src/lib/auth.ts';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // ------------------------------------------------------------------ //
    //  Clear existing data (order respects FK constraints)
    // ------------------------------------------------------------------ //
    console.log('Clearing existing data...');
    await db.execute(sql`
      TRUNCATE TABLE
        role_permissions,
        permissions,
        roles,
        "user"
      RESTART IDENTITY CASCADE
    `);

    console.log('Creating permissions...');
    const insertedPermissions = await db.insert(permissions).values(permissionRows).returning();
    console.log('✅ Permissions seeded');

    console.log('Creating roles...');
    const [adminRole, _] = await db
      .insert(roles)
      .values([{ name: 'admin' }, { name: 'user' }])
      .returning();
    console.log('✅ Roles seeded');

    // Assign all permissions to administrator
    const adminPermissions = insertedPermissions.map(p => ({ roleId: adminRole.id, permissionId: p.id }));
    await db.insert(rolePermissions).values(adminPermissions);
    console.log('✅ Assigned all permissions to admin role');

    console.log('creating admin user...');
    const { user: adminUser } = await auth.api.signUpEmail({
      body: {
        email: 'admin@techline.com',
        username: 'techline',
        name: 'techline',
        password: 'admin123@',
        firstName: 'techline',
        lastName: 'techline',
      },
    });
    await db.update(user).set({ role: adminRole.name }).where(eq(user.id, adminUser.id));
    console.log('✅ Users seeded');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔑 Login Credentials :');
    console.log('  admin@techline.com  / admin123@');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;
