import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';

import db from '../db/connection.ts';
import { admin, openAPI, phoneNumber, username } from 'better-auth/plugins';

export const auth = betterAuth({
  basePath: '/api/v1/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  trustedOrigins: ['http://localhost:3000'],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
        input: true,
      },
      lastName: {
        type: 'string',
        required: true,
        input: true,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: '',
      clientSecret: '',
    },
  },
  plugins: [openAPI(), phoneNumber(), username(), admin()],
});
