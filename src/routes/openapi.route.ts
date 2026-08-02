import { Router } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { generateMergedOpenApiDocument } from '../openapi/index.ts';

const docsCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net",
].join('; ');

export const openapiRouter = Router();

openapiRouter.get(
  '/docs',
  (_, res, next) => {
    res.setHeader('Content-Security-Policy', docsCsp);
    next();
  },
  apiReference({ url: '/api/v1/openapi.json' })
);

openapiRouter.get('/openapi.json', async (_, res, next) => {
  res.json(await generateMergedOpenApiDocument());
});
