import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.ts';
import db from '../../src/db/connection.ts';
import { attributeCombinationValues, attributeCombinations, productAttributes } from '../../src/db/schema.ts';
import * as productAttributeRepository from '../../src/domain/product/product-attribute.repository.ts';
import { createTestAgents } from '../helper/authHelpers.ts';
import { cleanupDatabase, cleanupProductData, createTestProduct } from '../helper/dbHelpers.ts';

const COMBINATIONS = '/attributes/combinations';

let valueCounter = 0;
function nextValueId() {
  valueCounter += 1;
  return 999000 + valueCounter;
}

let adminAgent: ReturnType<typeof request.agent>;

async function createAttributeWithValues(
  productId: number,
  attribute: { name: string; controlType?: 'SELECT' | 'TEXT' | 'COLOR'; displayOrder?: number },
  values: { name: string; priceAdjustment?: number; displayOrder?: number }[]
) {
  const res = await adminAgent.post(`/api/v1/admin/products/${productId}/attributes`).send({
    name: attribute.name,
    controlType: attribute.controlType ?? 'SELECT',
    displayOrder: attribute.displayOrder ?? 0,
    values: values.map(value => ({ name: value.name, priceAdjustment: value.priceAdjustment ?? 0, displayOrder: value.displayOrder ?? 0 })),
  });

  if (res.status !== 201) {
    throw new Error(`attribute fixture failed with status ${res.status}: ${JSON.stringify(res.body)}`);
  }

  return { attributeId: res.body.id as number, valueIds: (res.body.values as { id: number }[]).map(value => value.id) };
}

async function combinationRows(productId: number) {
  return await db.select().from(attributeCombinations).where(eq(attributeCombinations.productId, productId)).orderBy(attributeCombinations.id);
}

async function pivotRows(combinationId: number) {
  return await db.select().from(attributeCombinationValues).where(eq(attributeCombinationValues.attributeCombinationId, combinationId));
}

describe('Attribute Combination Endpoints', () => {
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

  describe(`POST /api/v1/admin/products/:id${COMBINATIONS}`, () => {
    it('creates a combination from one value per attribute', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);
      const size = await createAttributeWithValues(product.id, { name: 'Size' }, [{ name: 'S' }, { name: 'L' }]);

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({
        values: [color.valueIds[0], size.valueIds[0]],
        computedPrice: 35.5,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        productId: product.id,
        sku: null,
        availability: 'IN_STOCK',
        isDefault: false,
        overridePrice: null,
        values: 'Color: Red, Size: S',
        computedPrice: 35.5,
      });
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();

      const [row] = await combinationRows(product.id);
      expect(row.valueSignature).toBe('Color: Red, Size: S');

      const pivots = await pivotRows(res.body.id);
      expect(pivots.map(pivot => pivot.productAttributeValueId).sort((a, b) => a - b)).toEqual([color.valueIds[0], size.valueIds[0]].sort((a, b) => a - b));
    });

    it('never exposes the internal valueSignature field', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty('valueSignature');
      expect(res.body.values).toBe('Color: Red');
    });

    it('builds the signature in attribute display order, not payload order', async () => {
      const product = await createTestProduct();
      const second = await createAttributeWithValues(product.id, { name: 'Color', displayOrder: 1 }, [{ name: 'Red' }]);
      const first = await createAttributeWithValues(product.id, { name: 'Size', displayOrder: 0 }, [{ name: 'S' }]);

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [second.valueIds[0], first.valueIds[0]], computedPrice: 10 });

      expect(res.status).toBe(201);
      expect(res.body.values).toBe('Size: S, Color: Red');
    });

    it('stores the sku, availability and override price', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

      const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({
        values: [color.valueIds[0]],
        sku: 'RED-SMALL-01',
        availability: 'OUT_OF_STOCK',
        overridePrice: 99.99,
        computedPrice: 35.5,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ sku: 'RED-SMALL-01', availability: 'OUT_OF_STOCK', computedPrice: null });
      expect(Number(res.body.overridePrice)).toBe(99.99);

      const [row] = await combinationRows(product.id);
      expect(row.overridePrice).toBe('99.99');
    });

    it('promotes a new default combination and demotes the previous default', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }, { name: 'Blue' }]);

      const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, isDefault: true });
      expect(first.status).toBe(201);
      expect(first.body.isDefault).toBe(true);

      const second = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[1]], computedPrice: 10, isDefault: true });
      expect(second.status).toBe(201);

      const rows = await combinationRows(product.id);
      expect(rows.filter(row => row.isDefault)).toHaveLength(1);
      expect(rows.find(row => row.id === first.body.id)?.isDefault).toBe(false);
      expect(rows.find(row => row.id === second.body.id)?.isDefault).toBe(true);
    });

    it('leaves the existing default untouched when isDefault is false', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }, { name: 'Blue' }]);

      const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, isDefault: true });
      const second = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[1]], computedPrice: 10, isDefault: false });

      expect(second.status).toBe(201);
      expect((await combinationRows(product.id)).find(row => row.id === first.body.id)?.isDefault).toBe(true);
    });

    describe('payload validation', () => {
      it('rejects an empty values array', async () => {
        const product = await createTestProduct();

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toBe('At least one attribute value is required to create an attribute combination.');
      });

      it('rejects an omitted values array', async () => {
        const product = await createTestProduct();

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it.each([
        ['a non-numeric value id', ['abc']],
        ['a zero value id', [0]],
        ['a negative value id', [-1]],
        ['a fractional value id', [1.5]],
      ])('rejects %s', async (_label, values) => {
        const product = await createTestProduct();

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values, computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details[0].field).toContain('values');
      });

      it('rejects a sku shorter than 5 characters', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, sku: 'RED' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.some((d: { field: string }) => d.field === 'sku')).toBe(true);
      });

      it('rejects a negative price', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const computed = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: -1 });
        const overridden = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], overridePrice: -1 });

        expect(computed.status).toBe(400);
        expect(computed.body.error.code).toBe('VALIDATION_ERROR');
        expect(computed.body.error.details.some((d: { field: string }) => d.field === 'computedPrice')).toBe(true);
        expect(overridden.status).toBe(400);
        expect(overridden.body.error.details.some((d: { field: string }) => d.field === 'overridePrice')).toBe(true);
      });

      it('rejects an unknown availability', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, availability: 'SOLD_OUT' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.some((d: { field: string }) => d.field === 'availability')).toBe(true);
      });

      it('rejects a non-numeric price', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 'free' });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.some((d: { field: string }) => d.field === 'computedPrice')).toBe(true);
      });

      it('requires at least one of computedPrice or overridePrice', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]] });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toBe('At least one price is required');
      });

      it('rejects a non-numeric product id in the path', async () => {
        const res = await adminAgent.post(`/api/v1/admin/products/not-a-number${COMBINATIONS}`).send({ values: [1], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.some((d: { field: string }) => d.field === 'id')).toBe(true);
      });
    });

    describe('combination rules', () => {
      it('rejects two values that belong to the same attribute and rolls back', async () => {
        const product = await createTestProduct();
        const size = await createAttributeWithValues(product.id, { name: 'Size' }, [{ name: 'S' }, { name: 'L' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [size.valueIds[0], size.valueIds[1]], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toContain('Only one value per attribute');
        expect(res.body.error.message).toContain('Size');

        expect(await combinationRows(product.id)).toHaveLength(0);
        expect(await db.select().from(attributeCombinationValues)).toHaveLength(0);
      });

      it('accepts several values from the same attribute across different combinations', async () => {
        const product = await createTestProduct();
        const size = await createAttributeWithValues(product.id, { name: 'Size' }, [{ name: 'S' }, { name: 'L' }]);

        const small = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [size.valueIds[0]], computedPrice: 10 });
        const large = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [size.valueIds[1]], computedPrice: 12 });

        expect(small.status).toBe(201);
        expect(large.status).toBe(201);
        expect(large.body.values).toBe('Size: L');
      });
    });

    describe('database constraints', () => {
      it('returns 400 and rolls back when a value id does not exist', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);
        const missing = nextValueId();

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0], missing], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(res.body.error.message).toBe(`One or more attribute values do not exist: ${color.valueIds[0]}, ${missing}.`);

        expect(await combinationRows(product.id)).toHaveLength(0);
        expect(await db.select().from(attributeCombinationValues)).toHaveLength(0);
      });

      it('returns 400 and rolls back when the product does not exist', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/999999${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(res.body.error.message).toBe('The product with id "999999" does not exist.');

        expect(await combinationRows(product.id)).toHaveLength(0);
        expect(await db.select().from(attributeCombinationValues)).toHaveLength(0);
      });

      it('rejects a repeated value id as a conflict rather than a missing value', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0], color.valueIds[0]], computedPrice: 10 });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');
        expect(await combinationRows(product.id)).toHaveLength(0);
      });

      it('rejects values that belong to a different product', async () => {
        const product = await createTestProduct();
        const other = await createTestProduct();
        const otherColor = await createAttributeWithValues(other.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [otherColor.valueIds[0]], computedPrice: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(await combinationRows(product.id)).toHaveLength(0);
        expect(await combinationRows(other.id)).toHaveLength(0);
      });

      it('returns 409 and rolls back when the same value combination already exists', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });
        expect(first.status).toBe(201);

        const second = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, sku: 'RED-AGAIN' });

        expect(second.status).toBe(409);
        expect(second.body.error.code).toBe('CONFLICT');
        expect(second.body.error.message).toContain('already exists');

        expect(await combinationRows(product.id)).toHaveLength(1);
        expect(await db.select().from(attributeCombinationValues)).toHaveLength(1);
      });

      it('returns 409 when the sku is already used by another combination of the same product', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }, { name: 'Blue' }]);

        const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, sku: 'SHARED-SKU' });
        expect(first.status).toBe(201);

        const second = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[1]], computedPrice: 10, sku: 'SHARED-SKU' });

        expect(second.status).toBe(409);
        expect(second.body.error.code).toBe('CONFLICT');
        expect(second.body.error.message).toContain('SHARED-SKU');
        expect(await combinationRows(product.id)).toHaveLength(1);
      });

      it('returns 409 when a conflicting creation is requested as the default', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, isDefault: true });
        expect(first.status).toBe(201);

        const second = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, isDefault: true });

        expect(second.status).toBe(409);
        expect((await combinationRows(product.id)).find(row => row.id === first.body.id)?.isDefault).toBe(true);
      });

      it('allows the same value combination and sku on a different product', async () => {
        const product = await createTestProduct();
        const other = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);
        const otherColor = await createAttributeWithValues(other.id, { name: 'Color' }, [{ name: 'Red' }]);

        const first = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10, sku: 'REUSED-SKU' });
        const second = await adminAgent.post(`/api/v1/admin/products/${other.id}${COMBINATIONS}`).send({ values: [otherColor.valueIds[0]], computedPrice: 10, sku: 'REUSED-SKU' });

        expect(first.status).toBe(201);
        expect(second.status).toBe(201);
        expect(second.body.values).toBe('Color: Red');
      });

      it('accepts a zero computedPrice', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 0 });

        expect(res.status).toBe(201);
        expect(res.body.computedPrice).toBe(0);
      });

      it('accepts a zero overridePrice', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], overridePrice: 0 });

        expect(res.status).toBe(201);
        expect(Number(res.body.overridePrice)).toBe(0);
        expect(res.body.computedPrice).toBeNull();
      });

      it('maps the pivot foreign keys to business errors at the repository boundary', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }, { name: 'Blue' }]);

        const created = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });
        expect(created.status).toBe(201);

        await expect(productAttributeRepository.insertAttributeCombinationValues(999999, [color.valueIds[1]])).rejects.toThrow('The combination with id "999999" does not exist.');
        await expect(productAttributeRepository.insertAttributeCombinationValues(created.body.id, [nextValueId()])).rejects.toThrow('One or more attribute values do not exist');
      });

      it('keeps attribute values referenced by a combination', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await adminAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });
        expect(res.status).toBe(201);

        const [attribute] = await db.select().from(productAttributes).where(eq(productAttributes.id, color.attributeId));
        expect(attribute).toBeDefined();
      });
    });

    describe('authorization', () => {
      it('returns 403 for a user without the product update permission', async () => {
        const product = await createTestProduct();
        const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

        const res = await normalAgent.post(`/api/v1/admin/products/${product.id}${COMBINATIONS}`).send({ values: [color.valueIds[0]], computedPrice: 10 });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(await combinationRows(product.id)).toHaveLength(0);
      });

      it('returns 401 for unauthenticated requests', async () => {
        const res = await request(app)
          .post(`/api/v1/admin/products/1${COMBINATIONS}`)
          .send({ values: [1], computedPrice: 10 });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
    });
  });

  describe(`GET /api/v1/admin/products/:id${COMBINATIONS}/price`, () => {
    it('returns the base price plus the adjustments of the selected values', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [
        { name: 'Red', priceAdjustment: 5 },
        { name: 'Blue', priceAdjustment: 7 },
      ]);

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [color.valueIds[0]] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        basePrice: 10,
        computedPrice: 15,
        values: [{ attributeName: 'Color', name: 'Red', priceAdjustment: 5 }],
      });
    });

    it('sums the adjustments of one value per attribute', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red', priceAdjustment: 5 }]);
      const size = await createAttributeWithValues(product.id, { name: 'Size' }, [{ name: 'L', priceAdjustment: 2.5 }]);

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [color.valueIds[0], size.valueIds[0]] });

      expect(res.status).toBe(200);
      expect(res.body.computedPrice).toBe(17.5);
      expect(res.body.values).toHaveLength(2);
    });

    it('rounds the computed price to two decimals', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red', priceAdjustment: 0.335 }]);

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [color.valueIds[0]] });

      expect(res.status).toBe(200);
      expect(res.body.computedPrice).toBe(10.34);
    });

    it('returns 400 for an empty values array', async () => {
      const product = await createTestProduct();

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for a value id that does not exist instead of a partial price', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red', priceAdjustment: 5 }]);

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [color.valueIds[0], nextValueId()] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when two selected values belong to the same attribute', async () => {
      const product = await createTestProduct();
      const size = await createAttributeWithValues(product.id, { name: 'Size' }, [{ name: 'S' }, { name: 'L' }]);

      const res = await adminAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [size.valueIds[0], size.valueIds[1]] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Only one value per attribute');
    });

    it('returns 404 when the product does not exist', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

      const res = await adminAgent.get(`/api/v1/admin/products/999999${COMBINATIONS}/price`).send({ values: [color.valueIds[0]] });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('returns 403 for a user without the product view permission', async () => {
      const product = await createTestProduct();
      const color = await createAttributeWithValues(product.id, { name: 'Color' }, [{ name: 'Red' }]);

      const res = await normalAgent.get(`/api/v1/admin/products/${product.id}${COMBINATIONS}/price`).send({ values: [color.valueIds[0]] });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/products/1${COMBINATIONS}/price`)
        .send({ values: [1] });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
