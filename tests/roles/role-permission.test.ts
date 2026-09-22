import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app.ts';
import db from '../../src/db/connection.ts';
import { permissions, rolePermissions, roles } from '../../src/db/schema.ts';
import { cleanupDatabase, createTestPermissions, createTestRoles } from '../helper/dbHelpers.ts';
import { createTestAgents, resetRolesCache } from '../helper/authHelpers.ts';

describe('Roles and Permission Endpoints', () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let normalAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ adminAgent, normalAgent } = await createTestAgents());
  });

  afterEach(async () => {
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    resetRolesCache();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/v1/roles', () => {
    it('returns all roles with correct pagination metadata', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((r: { name: string }) => r.name).sort()).toEqual(['admin', 'user']);
    });

    it('does not leak the internal `total` column into items', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.items[0]).not.toHaveProperty('total');
      expect(Object.keys(res.body.items[0]).sort()).toEqual(['createdAt', 'id', 'name']);
    });

    it('applies default pagination when no query params are provided', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('paginates correctly with explicit page and pageSize', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles?page=2&pageSize=10');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('returns empty items but keeps total when page exceeds available data', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles?page=10&pageSize=10');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(1);
    });

    it('filters by search query using case-insensitive substring match', async () => {
      await db.insert(roles).values([{ name: 'admin' }, { name: 'superadmin' }, { name: 'user' }]);

      const res = await adminAgent.get('/api/v1/roles?search=admin');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((r: { name: string }) => r.name).sort()).toEqual(['admin', 'superadmin']);
    });

    it('returns an empty result when search matches nothing', async () => {
      await createTestRoles();

      const res = await adminAgent.get('/api/v1/roles?search=does-not-exist');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('rejects pageSize above the maximum of 100', async () => {
      const res = await adminAgent.get('/api/v1/roles?pageSize=101');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a negative page', async () => {
      const res = await adminAgent.get('/api/v1/roles?page=-1');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a non-numeric page', async () => {
      const res = await adminAgent.get('/api/v1/roles?page=abc');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the view permission', async () => {
      const res = await normalAgent.get('/api/v1/roles');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/roles', () => {
    it('creates a role and links the given permissions', async () => {
      const [perm1, perm2] = await createTestPermissions();

      const res = await adminAgent.post('/api/v1/roles').send({ name: 'editor', permissions: [perm1.id, perm2.id] });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'editor' });
      expect(res.body.id).toEqual(expect.any(Number));
      expect(res.body.createdAt).toBeDefined();

      const [roleRow] = await db.select().from(roles).where(eq(roles.name, 'editor'));
      expect(roleRow).toBeDefined();

      const links = await db.select().from(rolePermissions);
      expect(links).toHaveLength(2);
      expect(links.map(l => l.permissionId).sort()).toEqual([perm1.id, perm2.id].sort());
    });

    it('rejects permissions that are strings instead of ids', async () => {
      const res = await adminAgent.post('/api/v1/roles').send({ name: 'editor', permissions: ['not-a-number'] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when a linked permission does not exist', async () => {
      const res = await adminAgent.post('/api/v1/roles').send({ name: 'ghost', permissions: [999999] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');

      const ghost = await db.select().from(roles).where(eq(roles.name, 'ghost'));
      expect(ghost).toHaveLength(0);
    });

    it('returns 400 when the role name already exists', async () => {
      const [perm] = await createTestPermissions();
      await createTestRoles();

      const res = await adminAgent.post('/api/v1/roles').send({ name: 'admin', permissions: [perm.id] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 403 for a user without the create permission', async () => {
      const res = await normalAgent.post('/api/v1/roles').send({ name: 'editor' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/roles/:id', () => {
    it('returns the role with its permissions', async () => {
      const { adminRole: role } = await createTestRoles();
      const [perm1, perm2] = await createTestPermissions();
      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: perm1.id },
        { roleId: role.id, permissionId: perm2.id },
      ]);

      const res = await adminAgent.get(`/api/v1/roles/${role.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: role.id,
        name: role.name,
        permissions: expect.arrayContaining([expect.objectContaining({ id: perm1.id }), expect.objectContaining({ id: perm2.id })]),
      });
      expect(res.body.permissions).toHaveLength(2);
    });

    it('returns 404 when the role does not exist', async () => {
      const res = await adminAgent.get('/api/v1/roles/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('rejects a non-numeric role id', async () => {
      const res = await adminAgent.get('/api/v1/roles/abc');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the view permission', async () => {
      const res = await normalAgent.get('/api/v1/roles/1');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    it('deletes the role and its permission links', async () => {
      const { userRole: role } = await createTestRoles();
      const [perm1, perm2] = await createTestPermissions();
      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: perm1.id },
        { roleId: role.id, permissionId: perm2.id },
      ]);

      const res = await adminAgent.delete(`/api/v1/roles/${role.id}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});

      const remainingRoles = await db.select().from(roles).where(eq(roles.id, role.id));
      const remainingLinks = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      expect(remainingRoles).toHaveLength(0);
      expect(remainingLinks).toHaveLength(0);
    });

    it('returns 404 when the role does not exist', async () => {
      const res = await adminAgent.delete('/api/v1/roles/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('rejects a non-numeric role id', async () => {
      const res = await adminAgent.delete('/api/v1/roles/abc');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the delete permission', async () => {
      const res = await normalAgent.delete('/api/v1/roles/1');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/v1/roles/:id', () => {
    it('updates the role name', async () => {
      const { userRole: role } = await createTestRoles();

      const res = await adminAgent.put(`/api/v1/roles/${role.id}`).send({ name: 'superadmin' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: role.id, name: 'superadmin' });

      const [updated] = await db.select().from(roles).where(eq(roles.id, role.id));
      expect(updated.name).toBe('superadmin');
    });

    it('replaces the role permissions', async () => {
      const { userRole: role } = await createTestRoles();
      const [perm1, perm2] = await createTestPermissions();
      const [perm3] = await db
        .insert(permissions)
        .values([{ resource: 'order', action: 'read' }])
        .returning();
      await db.insert(rolePermissions).values([
        { roleId: role.id, permissionId: perm1.id },
        { roleId: role.id, permissionId: perm2.id },
      ]);

      const res = await adminAgent.put(`/api/v1/roles/${role.id}`).send({ permissions: [perm3.id] });

      expect(res.status).toBe(200);

      const links = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      expect(links).toHaveLength(1);
      expect(links[0].permissionId).toBe(perm3.id);
    });

    it('returns 404 when the role does not exist', async () => {
      const res = await adminAgent.put('/api/v1/roles/999999').send({ name: 'editor' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('returns 400 when the body has no fields to update', async () => {
      const { adminRole: role } = await createTestRoles();

      const res = await adminAgent.put(`/api/v1/roles/${role.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a non-numeric role id', async () => {
      const res = await adminAgent.put('/api/v1/roles/abc').send({ name: 'editor' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for a user without the update permission', async () => {
      const res = await normalAgent.put('/api/v1/roles/1').send({ name: 'editor' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/roles/permissions', () => {
    it('returns all available permissions', async () => {
      await createTestPermissions();

      const res = await adminAgent.get('/api/v1/roles/permissions');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((p: { resource: string; action: string }) => `${p.resource}:${p.action}`).sort()).toEqual(['product:update', 'user:create']);
      expect(Object.keys(res.body.items[0]).sort()).toEqual(['action', 'id', 'resource']);
    });

    it('returns an empty list when no permissions exist', async () => {
      const res = await adminAgent.get('/api/v1/roles/permissions');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });

    it('returns 403 for a user without the view permission', async () => {
      const res = await normalAgent.get('/api/v1/roles/permissions');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/roles');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
