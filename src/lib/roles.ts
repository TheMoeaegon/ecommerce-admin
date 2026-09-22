import { createAccessControl, role } from 'better-auth/plugins/access';

import { statement } from './permission.ts';
import { RolePermissionRepository, RoleRepository } from '../domain/roles/role-permission.repository.ts';

type RoleInstance = ReturnType<typeof role>;
type Statements = Record<string, string[]>;

let rolesCache: Record<string, RoleInstance> = {};

const defaultStatements: Record<string, Statements> = {
  admin: Object.fromEntries(Object.entries(statement).map(([resource, actions]) => [resource, [...actions]])),
  user: {},
};

export const ac = createAccessControl(statement);

export async function loadRoles(): Promise<Record<string, RoleInstance>> {
  const [{ items: roleRows }, permissionRows] = await Promise.all([RoleRepository.findMany(), RolePermissionRepository.findMany()]);

  let statementsByRole: Record<string, Statements>;
  if (roleRows.length === 0) {
    statementsByRole = defaultStatements;
  } else {
    const built: Record<string, Statements> = {};
    for (const { name } of roleRows) {
      built[name] = {};
    }
    for (const { roleName, resource, action } of permissionRows) {
      if (!built[roleName]) continue;
      (built[roleName][resource] ??= []).push(action);
    }
    statementsByRole = built;
  }

  rolesCache = Object.fromEntries(Object.entries(statementsByRole).map(([name, statements]) => [name, role(statements)]));

  return rolesCache;
}

export function getRoles(): Record<string, RoleInstance> {
  return rolesCache;
}

export async function refreshRoleInCache(roleId: number, roleName: string) {
  const roleWithPermissions = await RolePermissionRepository.findByRoleId(roleId);
  if (!roleWithPermissions) return;

  const statements: Statements = {};
  for (const { resource, action } of roleWithPermissions.permissions) {
    (statements[resource] ??= []).push(action);
  }
  rolesCache[roleName] = role(statements);
}

export function removeRoleFromCache(roleName: string) {
  delete rolesCache[roleName];
}
