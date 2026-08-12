import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../src/app.ts';
import db from '../src/db/connection.ts';
import { user } from '../src/db/schema.ts';
import { cleanupDatabase } from './helper/dbHelpers.ts';
import { createAdminUser, createUser, req } from './helper/authHelpers.ts';

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const uploadedFiles = new Set<string>();

function absolutePath(imageUrl: string) {
  return path.join(process.cwd(), imageUrl);
}

describe('Admin Profile Image Endpoints', () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let adminId: string;
  let normalAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const admin = await createAdminUser();
    adminAgent = await req(admin.email, admin.password);
    const profile = await adminAgent.get('/api/v1/users/admins/profiles');
    adminId = profile.body.id;

    const normal = await createUser();
    normalAgent = await req(normal.email, normal.password);
  });

  afterAll(async () => {
    for (const file of uploadedFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    await cleanupDatabase();
  });

  async function storedImage() {
    const [row] = await db.select().from(user).where(eq(user.id, adminId));
    return row.image;
  }

  describe('POST /api/v1/users/admins/profiles/images', () => {
    it('uploads an image and stores its url', async () => {
      const res = await adminAgent
        .post('/api/v1/users/admins/profiles/images')
        .attach('image', PNG_1x1, { filename: 'avatar.png', contentType: 'image/png' });

      expect(res.status).toBe(204);
      const image = await storedImage();
      expect(image).toMatch(/^\/uploads\/profile-images\/\d+-avatar\.png$/);
      expect(fs.existsSync(absolutePath(image!))).toBe(true);
      uploadedFiles.add(absolutePath(image!));
    });

    it('replaces the previous image and deletes the old file', async () => {
      const res = await adminAgent
        .post('/api/v1/users/admins/profiles/images')
        .attach('image', PNG_1x1, { filename: 'new.png', contentType: 'image/png' });

      expect(res.status).toBe(204);
      const image = await storedImage();
      expect(image).toMatch(/new\.png$/);

      for (const file of uploadedFiles) expect(fs.existsSync(file)).toBe(false);
      uploadedFiles.clear();
      uploadedFiles.add(absolutePath(image!));
    });

    it('returns 400 when the image field is missing', async () => {
      const res = await adminAgent.post('/api/v1/users/admins/profiles/images');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 for a non-image file type', async () => {
      const res = await adminAgent
        .post('/api/v1/users/admins/profiles/images')
        .attach('image', Buffer.from('hello world'), { filename: 'file.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 for a JSON request body', async () => {
      const res = await adminAgent.post('/api/v1/users/admins/profiles/images').send({ image: 'not-a-file' });

      expect(res.status).toBe(400);
    });

    it('returns 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/v1/users/admins/profiles/images')
        .attach('image', PNG_1x1, { filename: 'a.png', contentType: 'image/png' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/v1/users/admins/profiles/images', () => {
    it('deletes the current image and clears the user field', async () => {
      await adminAgent
        .post('/api/v1/users/admins/profiles/images')
        .attach('image', PNG_1x1, { filename: 'to-delete.png', contentType: 'image/png' });
      const image = await storedImage();
      uploadedFiles.add(absolutePath(image!));

      const res = await adminAgent.delete('/api/v1/users/admins/profiles/images');

      expect(res.status).toBe(204);
      expect(await storedImage()).toBeNull();
      expect(fs.existsSync(absolutePath(image!))).toBe(false);
      uploadedFiles.delete(absolutePath(image!));
    });

    it('is idempotent when no image exists', async () => {
      const res = await adminAgent.delete('/api/v1/users/admins/profiles/images');

      expect(res.status).toBe(204);
      expect(await storedImage()).toBeNull();
    });

    it('returns 401 for unauthenticated requests', async () => {
      const res = await request(app).delete('/api/v1/users/admins/profiles/images');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
