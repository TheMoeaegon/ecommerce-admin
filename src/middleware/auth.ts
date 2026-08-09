import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../lib/auth.ts';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.ts';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role?: string | null;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) throw new UnauthorizedError();
  req.user = session.user;
  next();
}

export function requirePermission(resource: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();

    const { success } = await auth.api.userHasPermission({
      body: {
        role: req?.user?.role ?? 'user',
        permissions: { [resource]: [action] },
      },
    });
    if (!success) throw new ForbiddenError();

    next();
  };
}
