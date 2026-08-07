import { createAccessControl, role } from 'better-auth/plugins/access';

import { statement } from './permission.ts';
import { RoleRepository } from '../domain/roles/role-permission.repository.ts';

type RoleInstance = ReturnType<typeof role>;
type Statements = Record<string, string[]>;

let rolesCache: Record<string, RoleInstance> = {};

export const ac = createAccessControl(statement);

export async function loadRoles(): Promise<Record<string, RoleInstance>> {
  const [{ items: roleRows }, permissionRows] = await Promise.all([
    RoleRepository.findMany(),
    RoleRepository.findRolesPermissions(),
  ]);

  const statementsByRole: Record<string, Statements> = {};
  for (const { name } of roleRows) {
    statementsByRole[name] = {};
  }
  for (const { roleName, resource, action } of permissionRows) {
    if (!statementsByRole[roleName]) continue;
    (statementsByRole[roleName][resource] ??= []).push(action);
  }

  rolesCache = Object.fromEntries(
    Object.entries(statementsByRole).map(([name, statements]) => [name, role(statements)])
  );

  return rolesCache;
}

export function getRoles(): Record<string, RoleInstance> {
  return rolesCache;
}
