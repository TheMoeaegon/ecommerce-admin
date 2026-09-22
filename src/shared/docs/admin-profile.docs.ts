import { registry } from '../../openapi/registry.ts';
import { retriveProfileResponseSchema, uploadProfileImageBodySchema } from '../../domain/users/admins/admin.schema.ts';
import { badRequestErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema } from '../schemas/index.ts';

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

registry.registerPath({
  method: 'post',
  path: '/users/admins/profiles/images',
  summary: '/api/v1/users/admins/profiles/images',
  description: 'Upload a new profile picture. The file is saved to disk, the user image is updated and the previous image is deleted.',
  tags: ['Admins'],
  request: {
    body: {
      content: {
        'multipart/form-data': { schema: uploadProfileImageBodySchema },
      },
    },
  },
  responses: {
    204: {
      description: 'Profile picture uploaded successfully',
    },
    400: {
      description: 'Invalid request - missing image field, invalid file type, or malformed multipart body',
      content: { 'application/json': { schema: badRequestErrorSchema } },
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

registry.registerPath({
  method: 'delete',
  path: '/users/admins/profiles/images',
  summary: '/api/v1/users/admins/profiles/images',
  description: 'Delete the current profile picture. Clears the user image and removes the file from disk.',
  tags: ['Admins'],
  responses: {
    204: {
      description: 'Profile picture deleted successfully',
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
