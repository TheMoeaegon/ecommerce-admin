import { registry } from '../../openapi/registry.ts';
import { badRequestErrorSchema, conflictErrorSchema, forbiddenErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema } from '../../shared/schemas/error.schema.ts';
import { createProductBodySchema, createProductResponseSchema } from '../../domain/product/product.schema.ts';

registry.register('CreateProductBody', createProductBodySchema);
registry.register('CreateProduct', createProductResponseSchema);

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Bearer token authentication',
});

registry.registerPath({
  method: 'post',
  path: '/admin/products',
  summary: 'Create a product',
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
