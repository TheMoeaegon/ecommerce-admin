import { sql } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import * as t from 'drizzle-orm/pg-core';
import { unique, primaryKey } from 'drizzle-orm/pg-core';

//better auth schema
export const user = pgTable('user', {
  id: t.text('id').primaryKey(),
  name: t.text('name').notNull(),
  email: t.varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: t.boolean('email_verified').notNull(),
  image: t.text('image'),
  phoneNumber: t.varchar('phone_number', { length: 255 }).unique(),
  firstName: t.varchar('first_name', { length: 255 }).notNull(),
  lastName: t.varchar('last_name', { length: 255 }).notNull(),
  phoneNumberVerified: t.boolean('phone_number_verified'),
  username: t.varchar('username', { length: 255 }).unique(),
  displayUsername: t.text('display_username'),
  role: t.text('role'),
  banned: t.boolean('banned'),
  banReason: t.text('ban_reason'),
  banExpires: t.timestamp('ban_expires', { precision: 6, withTimezone: true }),
  createdAt: t.timestamp('created_at', { precision: 6, withTimezone: true }).notNull(),
  updatedAt: t.timestamp('updated_at', { precision: 6, withTimezone: true }).notNull(),
});

export const session = pgTable('session', {
  id: t.text('id').primaryKey(),
  userId: t
    .text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: t.varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: t.timestamp('expires_at', { precision: 6, withTimezone: true }).notNull(),
  ipAddress: t.text('ip_address'),
  userAgent: t.text('user_agent'),
  impersonatedBy: t.text('impersonated_by'),
  createdAt: t.timestamp('created_at', { precision: 6, withTimezone: true }).notNull(),
  updatedAt: t.timestamp('updated_at', { precision: 6, withTimezone: true }).notNull(),
});

export const account = pgTable('account', {
  id: t.text('id').primaryKey(),
  userId: t
    .text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: t.text('account_id').notNull(),
  providerId: t.text('provider_id').notNull(),
  accessToken: t.text('access_token'),
  refreshToken: t.text('refresh_token'),
  accessTokenExpiresAt: t.timestamp('access_token_expires_at', { precision: 6, withTimezone: true }),
  refreshTokenExpiresAt: t.timestamp('refresh_token_expires_at', { precision: 6, withTimezone: true }),
  scope: t.text('scope'),
  idToken: t.text('id_token'),
  password: t.text('password'),
  createdAt: t.timestamp('created_at', { precision: 6, withTimezone: true }).notNull(),
  updatedAt: t.timestamp('updated_at', { precision: 6, withTimezone: true }).notNull(),
});

export const verification = pgTable('verification', {
  id: t.text('id').primaryKey(),
  identifier: t.text('identifier').notNull(),
  value: t.text('value').notNull(),
  expiresAt: t.timestamp('expires_at', { precision: 6, withTimezone: true }).notNull(),
  createdAt: t.timestamp('created_at', { precision: 6, withTimezone: true }).notNull(),
  updatedAt: t.timestamp('updated_at', { precision: 6, withTimezone: true }).notNull(),
});

//better auth schema end

export const roles = pgTable('roles', {
  id: t.serial('id').primaryKey(),
  name: t.varchar('name', { length: 100 }).notNull().unique(),
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
});

export const permissions = pgTable(
  'permissions',
  {
    id: t.serial('id').primaryKey(),
    resource: t.varchar('resource', { length: 100 }).notNull(),
    action: t.varchar('action', { length: 50 }).notNull(),
  },
  t => [unique().on(t.resource, t.action)]
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: t
      .integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: t
      .integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  t => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const media = pgTable('media', {
  id: t.serial('id').primaryKey(),
  url: t.text('url').notNull(),
  altText: t.varchar('alt_text', { length: 255 }),
  createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const brands = pgTable(
  'brands',
  {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 255 }).notNull(),
    slug: t.varchar('slug', { length: 255 }).notNull(),
    description: t.text('description'),
    pictureId: t.integer('picture_id').references(() => media.id, {
      onDelete: 'restrict',
    }),
    published: t.boolean('published').notNull().default(false),
    displayOrder: t.integer('display_order').notNull().default(0),
    deletedAt: t.timestamp('deleted_at', { withTimezone: true }),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [t.unique('brands_slug_unique').on(table.slug)]
);

export const manufacturers = pgTable(
  'manufacturers',
  {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 255 }).notNull(),
    slug: t.varchar('slug', { length: 255 }).notNull(),
    description: t.text('description'),
    pictureId: t.integer('picture_id').references(() => media.id, {
      onDelete: 'restrict',
    }),
    published: t.boolean('published').notNull().default(false),
    displayOrder: t.integer('display_order').notNull().default(0),
    deletedAt: t.timestamp('deleted_at', { withTimezone: true }),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [t.unique('manufacturers_slug_unique').on(table.slug)]
);

export const categories = pgTable(
  'categories',
  {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 255 }).notNull(),
    slug: t.varchar('slug', { length: 255 }).notNull(),
    description: t.text('description'),
    parentId: t.integer('parent_id').references((): t.AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    pictureId: t.integer('picture_id').references(() => media.id, {
      onDelete: 'restrict',
    }),
    published: t.boolean('published').notNull().default(false),
    showOnHomepage: t.boolean('show_on_homepage').notNull().default(false),
    displayOrder: t.integer('display_order').notNull().default(0),
    deletedAt: t.timestamp('deleted_at', { withTimezone: true }),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [t.unique('categories_slug_unique').on(table.slug), t.check('categories_no_self_parent', sql`${table.parentId} <> ${table.id}`)]
);

export const availabilityEnum = t.pgEnum('availability', ['IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER', 'COMING_SOON', 'DISCONTINUED']);

export const products = pgTable(
  'products',
  {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 255 }).notNull(),
    slug: t.varchar('slug', { length: 255 }).notNull(),
    shortDescription: t.text('short_description'),
    fullDescription: t.text('full_description'),

    sku: t.varchar('sku', { length: 100 }),
    brandId: t.integer('brand_id').references(() => brands.id, { onDelete: 'restrict' }),
    manufacturerId: t.integer('manufacturer_id').references(() => manufacturers.id, {
      onDelete: 'restrict',
    }),

    // Tier-price / nopCommerce-style base price. Always authoritative for
    // SIMPLE products. For VARIABLE products it acts as the fallback base
    // price — product_variants.price overrides it per-variant when set.
    // Defaults to 0 so admins can save a draft product before pricing is
    // finalized. Service layer must reject `published = true` while price = 0.
    price: t.numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    oldPrice: t.numeric('old_price', { precision: 12, scale: 2 }),

    ratingEnabled: t.boolean('rating_enabled').notNull().default(true),
    ratingAverage: t.numeric('rating_average', { precision: 3, scale: 2 }).notNull().default('0'),
    ratingCount: t.integer('rating_count').notNull().default(0),
    allowReviews: t.boolean('allow_reviews').notNull().default(true),
    availability: availabilityEnum('availability').notNull().default('IN_STOCK'),

    published: t.boolean('published').notNull().default(false),
    showOnHomepage: t.boolean('show_on_homepage').notNull().default(false),
    isNew: t.boolean('is_new').notNull().default(false),

    availableFrom: t.timestamp('available_from', { withTimezone: true }),
    availableTo: t.timestamp('available_to', { withTimezone: true }),
    displayOrder: t.integer('display_order').notNull().default(0),

    deletedAt: t.timestamp('deleted_at', { withTimezone: true }),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    t.unique('products_slug_unique').on(table.slug),
    t.unique('products_sku_unique').on(table.sku),
    t.check('products_price_non_negative', sql`${table.price} >= 0`),
    t.check('products_old_price_non_negative', sql`${table.oldPrice} >= 0`),
    t.check('products_rating_average_range', sql`${table.ratingAverage} BETWEEN 0 AND 5`),
    t.check('products_rating_count_non_negative', sql`${table.ratingCount} >= 0`),
    t.check('products_available_to_after_from', sql`${table.availableTo} IS NULL OR ${table.availableFrom} IS NULL OR ${table.availableTo} > ${table.availableFrom}`),
  ]
);

export const productMedia = pgTable(
  'product_media',
  {
    id: t.serial('id').primaryKey(),
    productId: t
      .integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaId: t
      .integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    displayOrder: t.integer('display_order').notNull().default(0),
    isPrimary: t.boolean('is_primary').notNull().default(false),
  },
  table => [
    t
      .uniqueIndex('product_media_one_primary_per_product')
      .on(table.productId)
      .where(sql`${table.isPrimary} = true`),
    t.uniqueIndex('product_media_product_id_media_id').on(table.productId, table.mediaId),
  ]
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: t
      .integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: t
      .integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.productId, table.categoryId] })]
);

export const tags = pgTable(
  'tags',
  {
    id: t.serial('id').primaryKey(),
    name: t.varchar('name', { length: 100 }).notNull(),
    slug: t.varchar('slug', { length: 100 }).notNull(),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [t.unique('tags_name_unique').on(table.name), t.unique('tags_slug_unique').on(table.slug)]
);

export const productTags = pgTable(
  'product_tags',
  {
    productId: t
      .integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    tagId: t
      .integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.productId, table.tagId] })]
);

export const controlTypeEnum = t.pgEnum('control_type', ['SELECT', 'RADIO', 'COLOR']);

export const productAttributes = pgTable(
  'product_attributes',
  {
    id: t.serial('id').primaryKey(),
    productId: t
      .integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: t.varchar('name', { length: 255 }).notNull(),
    description: t.text('description'),
    controlType: controlTypeEnum('control_type').notNull().default('SELECT'),
    displayOrder: t.integer('display_order').notNull().default(0),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [t.unique('product_attributes_product_id_name_unique').on(table.productId, table.name), t.check('product_attributes_display_order_non_negative', sql`${table.displayOrder} >= 0`)]
);

export const productAttributeValues = pgTable(
  'product_attribute_values',
  {
    id: t.serial('id').primaryKey(),
    productAttributeId: t
      .integer('product_attribute_id')
      .notNull()
      .references(() => productAttributes.id, { onDelete: 'cascade' }),
    name: t.varchar('name', { length: 255 }).notNull(),
    priceAdjustment: t.numeric('price_adjustment', { precision: 12, scale: 2 }).notNull().default('0'),
    displayOrder: t.integer('display_order').notNull().default(0),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    t.unique('product_attribute_values_attr_id_name_unique').on(table.productAttributeId, table.name),
    t.check('product_attribute_values_display_order_non_negative', sql`${table.displayOrder} >= 0`),
  ]
);

export const productAttributeValueMedia = pgTable(
  'product_attribute_value_media',
  {
    id: t.serial('id').primaryKey(),
    productAttributeValueId: t
      .integer('product_attribute_value_id')
      .notNull()
      .references(() => productAttributeValues.id, { onDelete: 'cascade' }),
    productMediaId: t
      .integer('product_media_id')
      .notNull()
      .references(() => productMedia.id, { onDelete: 'cascade' }),
    displayOrder: t.integer('display_order').notNull().default(0),
  },
  table => [
    t.check('product_attribute_value_media_display_order_non_negative', sql`${table.displayOrder} >= 0`),
    t.unique('product_attributes_value_id_product_media_id_unique').on(table.productAttributeValueId, table.productMediaId),
  ]
);

export const attributeCombinations = pgTable(
  'attribute_combinations',
  {
    id: t.serial('id').primaryKey(),
    productId: t
      .integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: t.varchar('sku', { length: 100 }).notNull(),
    availability: availabilityEnum('availability').notNull().default('IN_STOCK'),
    overridePrice: t.numeric('override_price', { precision: 12, scale: 2 }),
    createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    t.unique('attribute_combinations_product_id_sku_unique').on(table.productId, table.sku),
    t.check('attribute_combinations_override_price_non_negative', sql`${table.overridePrice} IS NULL OR ${table.overridePrice} >= 0`),
  ]
);

export const attributeCombinationValues = pgTable(
  'attribute_combination_values',
  {
    attributeCombinationId: t
      .integer('attribute_combination_id')
      .notNull()
      .references(() => attributeCombinations.id, { onDelete: 'cascade' }),
    productAttributeValueId: t
      .integer('product_attribute_value_id')
      .notNull()
      .references(() => productAttributeValues.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.attributeCombinationId, table.productAttributeValueId] })]
);

export const attributeCombinationMedia = pgTable(
  'attribute_combination_media',
  {
    attributeCombinationId: t
      .integer('attribute_combination_id')
      .notNull()
      .references(() => attributeCombinations.id, { onDelete: 'cascade' }),
    productMediaId: t
      .integer('product_media_id')
      .notNull()
      .references(() => productMedia.id, { onDelete: 'cascade' }),
    displayOrder: t.integer('display_order').notNull().default(0),
  },
  table => [primaryKey({ columns: [table.attributeCombinationId, table.productMediaId] }), t.check('attribute_combination_media_display_order_non_negative', sql`${table.displayOrder} >= 0`)]
);
