import { defaultStatements } from 'better-auth/plugins/admin/access';

export const statement = {
  ...defaultStatements,
  product: ['create', 'update', 'delete'],
} as const;

export const permissionRows = Object.entries(statement).flatMap(([resource, actions]) => actions.map((action: string) => ({ resource, action })));
