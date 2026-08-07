import { getRolesQuerySchema, getRolesResponseSchema } from '../../domain/roles/index.ts';
import { registry } from '../../openapi/registry.ts';

registry.registerPath({
  method: 'get',
  path: '/roles',
  summary: '/api/v1/roles',
  description: 'Use this endpoint to get a paginated list of roles.',
  tags: ['Roles'],
  request: {
    query: getRolesQuerySchema,
  },
  responses: {
    200: {
      description: 'Success ',
      content: { 'application/json': { schema: getRolesResponseSchema } },
    },
  },
});
