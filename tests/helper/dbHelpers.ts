import db from '../../src/db/connection.ts';
import { account, brands, categories, manufacturers, permissions, productCategories, products, productTags, rolePermissions, roles, session, tags, user, verification } from '../../src/db/schema.ts';

export async function createTestRoles() {
  const [adminRole, userRole] = await db
    .insert(roles)
    .values([{ name: 'admin' }, { name: 'user' }])
    .onConflictDoNothing()
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

let productFixtureCounter = 0;

function uniqueProductSlug(base: string) {
  productFixtureCounter += 1;
  return `${base}-${productFixtureCounter}-${Date.now()}`;
}

export async function createTestBrand() {
  const [brand] = await db
    .insert(brands)
    .values({ name: `Test Brand ${productFixtureCounter}`, slug: uniqueProductSlug('test-brand') })
    .returning();
  return brand;
}

export async function createTestManufacturer() {
  const [manufacturer] = await db
    .insert(manufacturers)
    .values({ name: `Test Manufacturer ${productFixtureCounter}`, slug: uniqueProductSlug('test-manufacturer') })
    .returning();
  return manufacturer;
}

export async function createTestCategory() {
  const [category] = await db
    .insert(categories)
    .values({ name: `Test Category ${productFixtureCounter}`, slug: uniqueProductSlug('test-category') })
    .returning();
  return category;
}

export async function createTestTag() {
  const [tag] = await db
    .insert(tags)
    .values({ name: `Test Tag ${productFixtureCounter}`, slug: uniqueProductSlug('test-tag') })
    .returning();
  return tag;
}

export async function cleanupProductData() {
  await db.delete(productCategories);
  await db.delete(productTags);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(tags);
  await db.delete(brands);
  await db.delete(manufacturers);
}

export async function cleanupDatabase() {
  //catalog
  await cleanupProductData();

  //roles and permissions
  await db.delete(rolePermissions);
  await db.delete(permissions);
  await db.delete(roles);

  //better auth tables
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
}
