import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

const isDevelopment = process.env.APP_STAGE === 'dev';
const isStaging = process.env.APP_STAGE === 'staging';
const isTesting = process.env.APP_STAGE === 'test';
const isProduction = process.env.APP_STAGE === 'production';

const envFile = isDevelopment ? '.env.dev' : isTesting ? '.env.test' : isStaging ? '.env.stage' : null;
if (envFile) {
  dotenv.config({ path: path.join(import.meta.dirname, envFile), override: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_STAGE: z.enum(['dev', 'test', 'staging', 'production']).default('dev'),

  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default('localhost'),
  CORS_ORIGINS: z.string().default('*'),

  DATABASE_URL: z.string().startsWith('postgresql://'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));

    error.issues.forEach(err => {
      const path = err.path.join('.');
      console.log(`${path}: ${err.message}`);
    });

    process.exit(1);
  }
  throw error;
}

// Helper functions for environment checks
export const isProd = () => env.APP_STAGE === 'production';
export const isDev = () => env.APP_STAGE === 'dev';
export const isStage = () => env.APP_STAGE === 'staging';
export const isTest = () => env.APP_STAGE === 'test';

// Export the validated environment object
export { env };

// Default export for convenience
export default env;
