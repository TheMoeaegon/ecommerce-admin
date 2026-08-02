import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';

import db from '../db/connection.ts';
import { openAPI } from 'better-auth/plugins';

export const auth = betterAuth({
  basePath: '/api/v1/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: '',
      clientSecret: '',
    },
  },
  plugins: [openAPI()],
});
