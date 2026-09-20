import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { availabilityEnum, products } from '../../db/schema.ts';

export const createProductBodySchema = createInsertSchema(products, {
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (lowercase, hyphens only)'),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().optional(),
  sku: z.string().max(100).optional(),
  brandId: z.number().int().positive().optional(),
  manufacturerId: z.number().int().positive().optional(),
  price: z.coerce.number({ error: 'Price is required' }).min(0, 'Price must be zero or greater').default(0),
  oldPrice: z.coerce.number().min(0, 'Old price must be zero or greater').optional(),
  availability: z.enum(availabilityEnum.enumValues).default('IN_STOCK'),
  ratingEnabled: z.boolean().default(true),
  allowReviews: z.boolean().default(true),
  published: z.boolean().default(false),
  showOnHomepage: z.boolean().default(false),
  isNew: z.boolean().default(false),
  availableFrom: z.coerce.date().optional(),
  availableTo: z.coerce.date().optional(),
  displayOrder: z.number().int().min(0, 'Display order must be zero or greater').default(0),
})
  .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, ratingAverage: true, ratingCount: true })
  .extend({
    categoryIds: z.array(z.number().int().positive()).default([]).describe('IDs of categories to link the product to'),
    tagIds: z.array(z.number().int().positive()).default([]).describe('IDs of tags to link the product to'),
  });

export const createProductResponseSchema = createSelectSchema(products).extend({
  categoryIds: z.array(z.number().int().positive()).default([]).describe('IDs of categories to link the product to'),
  tagIds: z.array(z.number().int().positive()).default([]).describe('IDs of tags to link the product to'),
});
