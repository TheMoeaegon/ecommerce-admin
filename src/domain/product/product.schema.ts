import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { availabilityEnum, controlTypeEnum, productAttributeValues, productAttributes, productMedia, products } from '../../db/schema.ts';

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

export const attachProductMediaParamsSchema = z.object({
  id: z.coerce.number().int().positive('Product id must be a positive integer'),
});

export const attachProductMediaBodySchema = z.object({
  media: z
    .array(
      z.string().openapi({
        type: 'string',
        format: 'binary',
        description: 'Image file (JPEG, PNG or WebP, max 5MB)',
      })
    )
    .min(1, 'At least one image is required')
    .max(5, 'A maximum of 5 images can be uploaded at once'),
});

export const attachProductMediaResponseSchema = z.array(createSelectSchema(productMedia));

export const productMediaParamsSchema = z.object({
  productId: z.coerce.number().int().positive('Product id must be a positive integer'),
  mediaId: z.coerce.number().int().positive('Media id must be a positive integer'),
});

export const updateProductMediaParamsSchema = productMediaParamsSchema;

export const removeProductMediaParamsSchema = productMediaParamsSchema;

export const updateProductMediaBodySchema = z
  .object({
    altText: z.string().max(255).optional(),
    title: z.string().max(255).optional(),
    displayOrder: z.number().int().min(0, 'Display order must be zero or greater').optional(),
  })
  .refine(data => data.altText !== undefined || data.title !== undefined || data.displayOrder !== undefined, {
    message: 'At least one of altText, title or displayOrder must be provided',
  });

export const updateProductMediaResponseSchema = createSelectSchema(productMedia).extend({
  url: z.string(),
  altText: z.string().nullable(),
  title: z.string().nullable(),
});

export const createProductAttributeParamsSchema = z.object({
  id: z.coerce.number().int().positive('Product id must be a positive integer'),
});

export const createProductAttributeValueBodySchema = z.object({
  name: z.string().min(1, 'Value name is required').max(255),
  priceAdjustment: z.coerce.number({ error: 'Price adjustment must be a number' }).min(0, 'Price adjustment must be zero or greater').default(0),
  displayOrder: z.number().int().min(0, 'Display order must be zero or greater').default(0),
});

export const createProductAttributeBodySchema = z.object({
  name: z.string().min(1, 'Attribute name is required').max(255),
  description: z.string().optional(),
  controlType: z.enum(controlTypeEnum.enumValues).default('SELECT'),
  displayOrder: z.number().int().min(0, 'Display order must be zero or greater').default(0),
  values: z.array(createProductAttributeValueBodySchema).default([]),
});

export const productAttributeResponseSchema = createSelectSchema(productAttributes);
export const productAttributeValueResponseSchema = createSelectSchema(productAttributeValues);

export const createProductAttributeResponseSchema = productAttributeResponseSchema.extend({
  values: z.array(productAttributeValueResponseSchema).describe('Values created alongside the attribute'),
});
