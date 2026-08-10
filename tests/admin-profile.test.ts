import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../src/app.ts';
import { cleanupDatabase } from './helper/dbHelpers.ts';
import { createAdminUser, createUser, req } from './helper/authHelpers.ts';

describe('Admin Profile Endpoint', () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let adminEmail: string;
  let normalAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const admin = await createAdminUser();
    adminEmail = admin.email;
    adminAgent = await req(admin.email, admin.password);

    const normal = await createUser();
    normalAgent = await req(normal.email, normal.password);
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/v1/users/admins/profiles', () => {
    it('should returns the profile of the authenticated user', async () => {
      const res = await adminAgent.get('/api/v1/users/admins/profiles');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: adminEmail,
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        username: expect.any(String),
        role: 'admin',
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.emailVerified).toBe(false);
    });

    it('return the profile of a non-admin authenticated user', async () => {
      const res = await normalAgent.get('/api/v1/users/admins/profiles');

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('user');
    });

    it('does not leak sensitive or internal fields', async () => {
      const res = await adminAgent.get('/api/v1/users/admins/profiles');

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('banned');
      expect(res.body).not.toHaveProperty('banReason');
      expect(res.body).not.toHaveProperty('banExpires');
      expect(res.body).not.toHaveProperty('displayUsername');
      expect(res.body).not.toHaveProperty('phoneNumberVerified');
      expect(res.body).not.toHaveProperty('createdAt');
      expect(res.body).not.toHaveProperty('updatedAt');
      expect(Object.keys(res.body).sort()).toEqual(['email', 'emailVerified', 'firstName', 'id', 'image', 'lastName', 'name', 'phoneNumber', 'role', 'username']);
    });

    it('returns 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/users/admins/profiles');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
