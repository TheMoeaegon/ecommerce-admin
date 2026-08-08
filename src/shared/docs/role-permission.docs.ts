import { registry } from '../../openapi/registry.ts';
import {
  createRoleBodySchema,
  createRoleResponseSchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
  removeRolePermissionParamsSchema,
  retrieveRolePermissionParamsSchema,
  retrieveRolePermissionResponseSchema,
  updateRoleBodySchema,
  updateRoleParamsSchema,
  updateRoleResponseSchema,
} from '../../domain/roles/index.ts';
import { badRequestErrorSchema, forbiddenErrorSchema, internalServerErrorSchema, notFoundErrorSchema, unauthorizedErrorSchema } from '../schemas/index.ts';

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
    400: {
      description: 'Invalid request query parameters',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden - you do not have permission to perform this action',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Resource not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/roles',
  summary: '/api/v1/roles',
  description: 'Create a new role and attach permissions to it.',
  tags: ['Roles'],
  request: {
    body: {
      content: { 'application/json': { schema: createRoleBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Role created successfully',
      content: { 'application/json': { schema: createRoleResponseSchema } },
    },
    400: {
      description: 'Invalid request body (e.g. permission IDs must be numbers)',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden - you do not have permission to perform this action',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Resource not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/roles/{id}',
  summary: '/api/v1/roles/{id}',
  description: 'Get a single role by id, including its permissions.',
  tags: ['Roles'],
  request: {
    params: retrieveRolePermissionParamsSchema,
  },
  responses: {
    200: {
      description: 'Success',
      content: { 'application/json': { schema: retrieveRolePermissionResponseSchema } },
    },
    400: {
      description: 'Invalid role id parameter',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden - you do not have permission to perform this action',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Role not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/roles/{id}',
  summary: '/api/v1/roles/{id}',
  description: 'Delete a role by id. Its role-permission links are removed as well.',
  tags: ['Roles'],
  request: {
    params: removeRolePermissionParamsSchema,
  },
  responses: {
    204: {
      description: 'Role deleted successfully',
    },
    400: {
      description: 'Invalid role id parameter',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden - you do not have permission to perform this action',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Role not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/roles/{id}',
  summary: '/api/v1/roles/{id}',
  description: 'Update a role name and/or its permissions. Permission links are replaced entirely when `permissions` is provided.',
  tags: ['Roles'],
  request: {
    params: updateRoleParamsSchema,
    body: {
      content: { 'application/json': { schema: updateRoleBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Role updated successfully',
      content: { 'application/json': { schema: updateRoleResponseSchema } },
    },
    400: {
      description: 'Invalid request body or role id parameter',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized - missing or invalid credentials',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden - you do not have permission to perform this action',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Role not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});
