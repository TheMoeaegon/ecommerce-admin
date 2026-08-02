import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.ts';
import { auth } from '../lib/auth.ts';

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.1',
    info: { title: 'Commerce Core API', version: '0.1.0' },
    servers: [{ url: '/api/v1' }],
  });
}

export async function generateMergedOpenApiDocument() {
  const appSpec = generateOpenApiDocument();
  const authSpec = await auth.api.generateOpenAPISchema({ headers: {} });

  const basePath = auth.options.basePath;
  const authPaths = Object.fromEntries(
    Object.entries(authSpec.paths).map(([path, methods]) => [`${basePath}${path}`, methods])
  );

  return {
    ...appSpec,
    paths: {
      ...appSpec.paths,
      ...authPaths,
    },
    components: {
      ...appSpec.components,
      schemas: {
        ...appSpec.components?.schemas,
        ...authSpec.components?.schemas,
      },
      securitySchemes: {
        ...appSpec.components?.securitySchemes,
        ...authSpec.components?.securitySchemes,
      },
    },
  };
}
