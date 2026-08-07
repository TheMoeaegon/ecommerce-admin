import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/app.ts';
import db from '../src/db/connection.ts';
import { roles } from '../src/db/schema.ts';
import { cleanupDatabase, createTestRoles } from './helper/dbHelpers.ts';

describe('Roles and Permission Endpoints', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });
  describe('GET /api/v1/roles', () => {
    it('returns all roles with correct pagination metadata', async () => {
      await db.insert(roles).values([{ name: 'moderator' }]);

      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.items.map((r: { name: string }) => r.name).sort()).toEqual(['admin', 'moderator', 'user']);
    });

    it('does not leak the internal `total` column into items', async () => {
      await createTestRoles();

      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.items[0]).not.toHaveProperty('total');
      expect(Object.keys(res.body.items[0]).sort()).toEqual(['createdAt', 'id', 'name']);
    });

    it('applies default pagination when no query params are provided', async () => {
      await createTestRoles();

      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('paginates correctly with explicit page and pageSize', async () => {
      await createTestRoles();

      const res = await request(app).get('/api/v1/roles?page=2&pageSize=10');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('returns empty items but keeps total when page exceeds available data', async () => {
      await createTestRoles();

      const res = await request(app).get('/api/v1/roles?page=10&pageSize=10');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('filters by search query using case-insensitive substring match', async () => {
      await db.insert(roles).values([{ name: 'admin' }, { name: 'superadmin' }, { name: 'user' }]);

      const res = await request(app).get('/api/v1/roles?search=admin');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((r: { name: string }) => r.name).sort()).toEqual(['admin', 'superadmin']);
    });

    it('returns an empty result when search matches nothing', async () => {
      await createTestRoles();

      const res = await request(app).get('/api/v1/roles?search=does-not-exist');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('rejects pageSize above the maximum of 100', async () => {
      const res = await request(app).get('/api/v1/roles?pageSize=101');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a negative page', async () => {
      const res = await request(app).get('/api/v1/roles?page=-1');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a non-numeric page', async () => {
      const res = await request(app).get('/api/v1/roles?page=abc');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
