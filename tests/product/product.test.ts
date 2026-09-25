import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.ts';
import db from '../../src/db/connection.ts';
import { productAttributeValues, productAttributes, productCategories, products, productTags } from '../../src/db/schema.ts';
import * as productAttributeRepository from '../../src/domain/product/product-attribute.repository.ts';
import { cleanupDatabase, cleanupProductData, createTestBrand, createTestCategory, createTestManufacturer, createTestProduct, createTestTag } from '../helper/dbHelpers.ts';
import { createTestAgents } from '../helper/authHelpers.ts';

let uniqueIndex = 0;
function uniqueSlug(base: string) {
  uniqueIndex += 1;
  return `${base}-${uniqueIndex}-${Date.now()}`;
}

describe('Product Endpoints', () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let normalAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ adminAgent, normalAgent } = await createTestAgents());
  });

  afterEach(async () => {
    await cleanupProductData();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/v1/admin/products', () => {
    it('creates a minimal product applying schema defaults', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'T-Shirt',
        slug: 't-shirt',
        price: 25,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: 'T-Shirt',
        slug: 't-shirt',
        availability: 'IN_STOCK',
        published: false,
        showOnHomepage: false,
        isNew: false,
        ratingEnabled: true,
        allowReviews: true,
        ratingCount: 0,
      });
      expect(res.body.id).toEqual(expect.any(Number));
      expect(res.body.price).toEqual(expect.any(String));
      expect(Number(res.body.price)).toBe(25);
      expect(res.body.ratingAverage).toEqual(expect.any(String));
      expect(Number(res.body.ratingAverage)).toBe(0);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();

      const [row] = await db.select().from(products).where(eq(products.slug, 't-shirt'));
      expect(row).toBeDefined();
      expect(Number(row.price)).toBe(25);
    });

    it('creates a product with a brand and manufacturer', async () => {
      const brand = await createTestBrand();
      const manufacturer = await createTestManufacturer();

      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Branded Shirt',
        slug: uniqueSlug('branded-shirt'),
        price: 40,
        brandId: brand.id,
        manufacturerId: manufacturer.id,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ brandId: brand.id, manufacturerId: manufacturer.id });

      const [row] = await db.select().from(products).where(eq(products.id, res.body.id));
      expect(row.brandId).toBe(brand.id);
      expect(row.manufacturerId).toBe(manufacturer.id);
    });

    it('links the provided categories and tags', async () => {
      const category = await createTestCategory();
      const tag = await createTestTag();

      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Linked Shirt',
        slug: uniqueSlug('linked-shirt'),
        price: 30,
        categoryIds: [category.id],
        tagIds: [tag.id],
      });

      expect(res.status).toBe(201);

      const categoryRows = await db.select().from(productCategories).where(eq(productCategories.productId, res.body.id));
      expect(categoryRows).toHaveLength(1);
      expect(categoryRows[0].categoryId).toBe(category.id);

      const tagRows = await db.select().from(productTags).where(eq(productTags.productId, res.body.id));
      expect(tagRows).toHaveLength(1);
      expect(tagRows[0].tagId).toBe(tag.id);
    });

    it('creates no category/tag links when none are provided', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Bare Shirt',
        slug: uniqueSlug('bare-shirt'),
        price: 10,
      });

      expect(res.status).toBe(201);

      const categoryRows = await db.select().from(productCategories).where(eq(productCategories.productId, res.body.id));
      const tagRows = await db.select().from(productTags).where(eq(productTags.productId, res.body.id));
      expect(categoryRows).toHaveLength(0);
      expect(tagRows).toHaveLength(0);
    });

    it('returns 400 and rolls back the product when a category id does not exist', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Ghost Category Shirt',
        slug: uniqueSlug('ghost-category-shirt'),
        price: 10,
        categoryIds: [999999],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('category');

      const rows = await db.select().from(products).where(eq(products.name, 'Ghost Category Shirt'));
      expect(rows).toHaveLength(0);
    });

    it('returns 400 and rolls back the product when a tag id does not exist', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Ghost Tag Shirt',
        slug: uniqueSlug('ghost-tag-shirt'),
        price: 10,
        tagIds: [999999],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('tag');

      const rows = await db.select().from(products).where(eq(products.name, 'Ghost Tag Shirt'));
      expect(rows).toHaveLength(0);
    });

    it('returns 400 when the brand does not exist', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Ghost Brand Shirt',
        slug: uniqueSlug('ghost-brand-shirt'),
        price: 10,
        brandId: 999999,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when the manufacturer does not exist', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Ghost Manufacturer Shirt',
        slug: uniqueSlug('ghost-manufacturer-shirt'),
        price: 10,
        manufacturerId: 999999,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 409 when a product with the same slug already exists', async () => {
      const slug = uniqueSlug('duplicate-slug');

      const first = await adminAgent.post('/api/v1/admin/products').send({ name: 'First', slug, price: 10 });
      expect(first.status).toBe(201);

      const second = await adminAgent.post('/api/v1/admin/products').send({ name: 'Second', slug, price: 20 });
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('CONFLICT');
    });

    it('returns 409 when a product with the same sku already exists', async () => {
      const sku = `SKU-${uniqueIndex}-${Date.now()}`;

      const first = await adminAgent.post('/api/v1/admin/products').send({ name: 'First Sku', slug: uniqueSlug('first-sku'), price: 10, sku });
      expect(first.status).toBe(201);

      const second = await adminAgent.post('/api/v1/admin/products').send({ name: 'Second Sku', slug: uniqueSlug('second-sku'), price: 10, sku });
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 when the price is negative', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Negative Price',
        slug: uniqueSlug('negative-price'),
        price: -1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.some((d: { field: string; message: string }) => d.field === 'price' && d.message === 'Price must be zero or greater')).toBe(true);
    });

    it('returns 400 when publishing a zero-price product', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Free Published',
        slug: uniqueSlug('free-published'),
        price: 0,
        published: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('published');
    });

    it('allows a zero-price draft', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Free Draft',
        slug: uniqueSlug('free-draft'),
        price: 0,
      });

      expect(res.status).toBe(201);
      expect(res.body.published).toBe(false);
    });

    it('returns 400 when availableTo is before availableFrom', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Bad Dates',
        slug: uniqueSlug('bad-dates'),
        price: 10,
        availableFrom: '2026-01-02T00:00:00.000Z',
        availableTo: '2026-01-01T00:00:00.000Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('availableTo');
    });

    it('returns 400 for an invalid slug format', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Bad Slug',
        slug: 'Invalid Slug!',
        price: 10,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when the name is missing', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        slug: uniqueSlug('no-name'),
        price: 10,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when a price is not numeric', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Non Numeric Price',
        slug: uniqueSlug('non-numeric-price'),
        price: 'abc',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when categoryIds contains non-numeric values', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Bad Category Ids',
        slug: uniqueSlug('bad-category-ids'),
        price: 10,
        categoryIds: ['not-a-number'],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when tagIds contains non-positive values', async () => {
      const res = await adminAgent.post('/api/v1/admin/products').send({
        name: 'Bad Tag Ids',
        slug: uniqueSlug('bad-tag-ids'),
        price: 10,
        tagIds: [0, -1],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the product create permission', async () => {
      const res = await normalAgent.post('/api/v1/admin/products').send({
        name: 'Forbidden Shirt',
        slug: uniqueSlug('forbidden-shirt'),
        price: 10,
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .send({
          name: 'Unauthenticated Shirt',
          slug: uniqueSlug('unauthenticated-shirt'),
          price: 10,
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/admin/products/:id/attributes', () => {
    it('creates an attribute with its values', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
        controlType: 'SELECT',
        values: [
          { name: 'S', priceAdjustment: 0 },
          { name: 'L', priceAdjustment: '5.50', displayOrder: 2 },
        ],
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        productId: product.id,
        name: 'Size',
        controlType: 'SELECT',
        displayOrder: 0,
      });
      expect(res.body.description).toBeNull();
      expect(res.body.values).toHaveLength(2);
      expect(res.body.values.map(v => v.name).sort()).toEqual(['L', 'S']);
      const largeAdjustment = res.body.values.find(v => v.name === 'L');
      expect(Number(largeAdjustment.priceAdjustment)).toBe(5.5);

      const [attr] = await db.select().from(productAttributes).where(eq(productAttributes.id, res.body.id));
      expect(attr.productId).toBe(product.id);

      const valueRows = await db.select().from(productAttributeValues).where(eq(productAttributeValues.productAttributeId, res.body.id)).orderBy(productAttributeValues.id);
      expect(valueRows).toHaveLength(2);
      expect(valueRows.map(v => v.name)).toEqual(['S', 'L']);
      expect(Number(valueRows[0].priceAdjustment)).toBe(0);
      expect(Number(valueRows[1].priceAdjustment)).toBe(5.5);
    });

    it('creates an attribute with no values when values are omitted', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Brand',
      });

      expect(res.status).toBe(201);
      expect(res.body.values).toEqual([]);

      const valueRows = await db.select().from(productAttributeValues).where(eq(productAttributeValues.productAttributeId, res.body.id));
      expect(valueRows).toHaveLength(0);
    });

    it('returns 400 for an invalid controlType', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Color',
        controlType: 'CHECKBOX',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 and rolls back when the product does not exist', async () => {
      const res = await adminAgent.post('/api/v1/admin/products/999999/attributes').send({
        name: 'Size',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');

      const rows = await db.select().from(productAttributes);
      expect(rows).toHaveLength(0);
    });

    it('returns 409 when the attribute name already exists for the product', async () => {
      const product = await createTestProduct();

      const first = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({ name: 'Color' });
      expect(first.status).toBe(201);

      const second = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({ name: 'Color' });
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('CONFLICT');
    });

    it('allows the same attribute name on a different product', async () => {
      const productA = await createTestProduct();
      const productB = await createTestProduct();

      const first = await adminAgent.post(`/api/v1/admin/products/${productA.id}/attributes`).send({ name: 'Color' });
      const second = await adminAgent.post(`/api/v1/admin/products/${productB.id}/attributes`).send({ name: 'Color' });

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
    });

    it('returns 409 and rolls back when a value name duplicates another value in the same attribute', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
        values: [{ name: 'S' }, { name: 'S' }],
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');

      const attrs = await db.select().from(productAttributes).where(eq(productAttributes.name, 'Size'));
      expect(attrs).toHaveLength(0);
    });

    it('allows the same value name on different attributes', async () => {
      const product = await createTestProduct();

      const size = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({ name: 'Size', values: [{ name: 'S' }] });
      const color = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({ name: 'Color', values: [{ name: 'S' }] });

      expect(size.status).toBe(201);
      expect(color.status).toBe(201);
    });

    it('returns 400 when the attribute displayOrder is negative', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
        displayOrder: -1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when a value displayOrder is negative', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
        values: [{ name: 'S', displayOrder: -1 }],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when a value priceAdjustment is negative', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
        values: [{ name: 'S', priceAdjustment: -5 }],
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the product update permission', async () => {
      const product = await createTestProduct();

      const res = await normalAgent.post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Forbidden',
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 for unauthenticated requests', async () => {
      const product = await createTestProduct();

      const res = await request(app).post(`/api/v1/admin/products/${product.id}/attributes`).send({
        name: 'Size',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects a value whose attribute does not exist (FK constraint)', async () => {
      const promise = productAttributeRepository.insertManyAttributeValue([{ name: 'S', priceAdjustment: '0', displayOrder: 0, productAttributeId: 999999 }]);

      await expect(promise).rejects.toThrow('The attribute with id "999999" does not exist.');
    });
  });
});
