import { registry } from '../../openapi/registry.ts';
import { retriveProfileResponseSchema } from '../../domain/users/admins/admin.schema.ts';
import { internalServerErrorSchema, unauthorizedErrorSchema } from '../schemas/index.ts';

registry.registerPath({
  method: 'get',
  path: '/users/admins/profiles',
  summary: '/api/v1/users/admins/profiles',
  description: 'Get the profile of the currently authenticated user.',
  tags: ['Admins'],
  responses: {
    200: {
      description: 'Success - Returns the authenticated user profile',
      content: { 'application/json': { schema: retriveProfileResponseSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});
