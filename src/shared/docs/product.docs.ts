import { registry } from '../../openapi/registry.ts';
import {
  attachProductMediaBodySchema,
  attachProductMediaParamsSchema,
  attachProductMediaResponseSchema,
  createProductAttributeBodySchema,
  createProductAttributeParamsSchema,
  createProductAttributeResponseSchema,
  createProductBodySchema,
  createProductResponseSchema,
  productMediaParamsSchema,
  updateProductMediaBodySchema,
  updateProductMediaResponseSchema,
} from '../../domain/product/product.schema.ts';
import { badRequestErrorSchema, conflictErrorSchema, forbiddenErrorSchema, internalServerErrorSchema, notFoundErrorSchema, unauthorizedErrorSchema } from '../../shared/schemas/error.schema.ts';

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Bearer token authentication',
});

registry.registerPath({
  method: 'post',
  path: '/admin/products',
  summary: '/api/v1/admin/products',
  description: 'Creates a new product with its base details. Attach media, tags, attributes and combinations afterwards via the admin product sub-resource endpoints.',
  tags: ['Admin Products'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createProductBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Product created',
      content: { 'application/json': { schema: createProductResponseSchema } },
    },
    400: {
      description: 'Validation error or business rule violation',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    409: {
      description: 'A product with the same slug or sku already exists',
      content: { 'application/json': { schema: conflictErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/admin/products/{id}/media',
  summary: '/api/v1/admin/products/{id}/media',
  description:
    'Upload up to 5 images and attach them to a product. Each image is saved to disk and linked to the product as a media row. If any step fails, the links and saved files are rolled back.',
  tags: ['Admin Products'],
  security: [{ bearerAuth: [] }],
  request: {
    params: attachProductMediaParamsSchema,
    body: {
      content: { 'multipart/form-data': { schema: attachProductMediaBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Media uploaded and attached to the product',
      content: { 'application/json': { schema: attachProductMediaResponseSchema } },
    },
    400: {
      description: 'Validation error, missing files, or invalid file type',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Product not found',
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
  path: '/admin/products/{id}/attributes',
  summary: '/api/v1/admin/products/{id}/attributes',
  description: 'Create a product attribute together with its values. Values are optional and each carries a price adjustment and display order.',
  tags: ['Admin Products'],
  security: [{ bearerAuth: [] }],
  request: {
    params: createProductAttributeParamsSchema,
    body: {
      content: { 'application/json': { schema: createProductAttributeBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Attribute created with its values',
      content: { 'application/json': { schema: createProductAttributeResponseSchema } },
    },
    400: {
      description: 'Validation error or the product does not exist',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    409: {
      description: 'An attribute with the same name already exists for the product',
      content: { 'application/json': { schema: conflictErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/admin/products/{productId}/media/{mediaId}',
  summary: '/api/v1/admin/products/{productId}/media/{mediaId}',
  description: 'Update the alt text, title and/or display order of a product media link. Provide at least one updatable field.',
  tags: ['Admin Products'],
  security: [{ bearerAuth: [] }],
  request: {
    params: productMediaParamsSchema,
    body: {
      content: { 'application/json': { schema: updateProductMediaBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Product media updated successfully',
      content: { 'application/json': { schema: updateProductMediaResponseSchema } },
    },
    400: {
      description: 'Validation error or business rule violation',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Product media link not found',
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
  path: '/admin/products/{productId}/media/{mediaId}',
  summary: '/api/v1/admin/products/{productId}/media/{mediaId}',
  description: 'Detach a media from a product. The media row and its file on disk are also deleted.',
  tags: ['Admin Products'],
  security: [{ bearerAuth: [] }],
  request: {
    params: productMediaParamsSchema,
  },
  responses: {
    204: {
      description: 'Media removed from the product',
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: badRequestErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: unauthorizedErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: forbiddenErrorSchema } },
    },
    404: {
      description: 'Product media link not found',
      content: { 'application/json': { schema: notFoundErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: internalServerErrorSchema } },
    },
  },
});
