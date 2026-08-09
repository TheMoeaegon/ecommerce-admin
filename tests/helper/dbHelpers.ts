import db from '../../src/db/connection.ts';
import { account, permissions, rolePermissions, roles, session, user, verification } from '../../src/db/schema.ts';

export async function createTestRoles() {
  const [adminRole, userRole] = await db
    .insert(roles)
    .values([{ name: 'admin' }, { name: 'user' }])
    .returning();

  return { adminRole, userRole };
}

export async function createTestPermissions() {
  const [perm1, perm2] = await db
    .insert(permissions)
    .values([
      { resource: 'user', action: 'create' },
      { resource: 'product', action: 'update' },
    ])
    .returning();
  return [perm1, perm2];
}

export async function cleanupRoleData() {
  await db.delete(rolePermissions);
  await db.delete(permissions);
  await db.delete(roles);
}

export async function cleanupDatabase() {
  await db.delete(rolePermissions);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
}
