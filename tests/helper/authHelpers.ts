import request from 'supertest';
import { eq } from 'drizzle-orm';

import app from '../../src/app.ts';
import db from '../../src/db/connection.ts';
import { user } from '../../src/db/schema.ts';
import { auth } from '../../src/lib/auth.ts';
import { getRoles } from '../../src/lib/roles.ts';

const baselineRoles = { ...getRoles() };

export function resetRolesCache() {
  const cache = getRoles();
  for (const key of Object.keys(cache)) delete cache[key];
  Object.assign(cache, baselineRoles);
}

let userCounter = 0;

export async function createTestUser({ role = 'user' }: { role?: string } = {}) {
  userCounter += 1;
  const email = `test-${userCounter}-${Date.now()}@test.dev`;
  const password = 'Password123!';

  const { user: created } = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${userCounter}${Date.now()}`,
    },
  });

  if (role !== 'user') {
    await db.update(user).set({ role }).where(eq(user.id, created.id));
  }

  return { id: created.id, email, password, role };
}

export async function createAdminUser() {
  const { email, password } = await createTestUser({ role: 'admin' });
  return { email, password };
}

export async function createUser() {
  const { email, password } = await createTestUser();
  return { email, password };
}

export async function req(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/sign-in/email').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return agent;
}

export async function createTestAgents() {
  const admin = await createAdminUser();
  const adminAgent = await req(admin.email, admin.password);

  const normal = await createUser();
  const normalAgent = await req(normal.email, normal.password);

  return { adminAgent, normalAgent, adminEmail: admin.email, normalEmail: normal.email };
}
