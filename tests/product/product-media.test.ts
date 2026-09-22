import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import db from '../../src/db/connection.ts';
import { media, productMedia } from '../../src/db/schema.ts';
import { cleanupDatabase, cleanupProductData, createTestProduct } from '../helper/dbHelpers.ts';
import { createTestAgents } from '../helper/authHelpers.ts';
import productMediaRepository from '../../src/domain/product/product-media.repository.ts';

const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const uploadedFiles = new Set<string>();

function absolutePath(mediaUrl: string) {
  return path.join(process.cwd(), mediaUrl);
}

function attachMedia(agent: ReturnType<typeof request.agent>, productId: number, fileNames: string[]) {
  let req = agent.post(`/api/v1/admin/products/${productId}/media`);
  for (const name of fileNames) {
    req = req.attach('media', PNG_1x1, { filename: name, contentType: 'image/png' });
  }
  return req;
}

describe('Admin Product Media Endpoints', () => {
  let adminAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    ({ adminAgent } = await createTestAgents());
  });

  afterEach(async () => {
    await cleanupProductData();
  });

  afterAll(async () => {
    for (const file of uploadedFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    await cleanupDatabase();
  });

  describe('POST /api/v1/admin/products/:id/media', () => {
    it('creates media rows and links them to the product', async () => {
      const product = await createTestProduct();
      const productId = product.id;

      const res = await attachMedia(adminAgent, productId, ['photo-1.png', 'photo-2.png']);

      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((m: { productId: number; mediaId: number; isPrimary: boolean }) => m.productId === productId && m.isPrimary === false)).toBe(true);
      expect(res.body.map((m: { mediaId: number }) => m.mediaId)).toEqual([expect.any(Number), expect.any(Number)]);

      const mediaRows = await db.select().from(media);
      expect(mediaRows).toHaveLength(2);
      for (const row of mediaRows) {
        expect(row.url).toMatch(/^\/uploads\/product-media\/.+\.png$/);
        uploadedFiles.add(absolutePath(row.url));
      }

      const links = await db.select().from(productMedia);
      expect(links).toHaveLength(2);
      expect(links.every(l => l.productId === productId)).toBe(true);
    });

    it('returns the translated error and rolls back when the product does not exist', async () => {
      const res = await attachMedia(adminAgent, 999999, ['ghost.png']);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('does not exist');

      const mediaRows = await db.select().from(media);
      expect(mediaRows).toHaveLength(0);
    });

    it('returns conflict when the same media is linked twice', async () => {
      const product = await createTestProduct();
      const productId = product.id;

      const [mediaRow] = await db
        .insert(media)
        .values({ url: `/uploads/product-media/dup-${Date.now()}.png` })
        .returning();

      const attach = (items: { mediaId: number; productId: number }[]) => productMediaRepository.addMediaToProduct(productId, items);

      await attach([{ mediaId: mediaRow.id, productId }]);

      await expect(attach([{ mediaId: mediaRow.id, productId }])).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});
