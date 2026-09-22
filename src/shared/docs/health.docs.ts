import { registry } from '../../openapi/registry.ts';
import { healthResponseSchema } from '../schemas/health.schema.ts';

// const healthResponse = registry.register('Health', healthResponseSchema);

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: '/api/v1/health',
  tags: ['System'],
  responses: {
    200: {
      description: 'Success - Service is healthy',
      content: { 'application/json': { schema: healthResponseSchema } },
    },
  },
});
