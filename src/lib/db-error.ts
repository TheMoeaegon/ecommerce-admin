import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../shared/errors.ts';
import { createModuleLogger } from './logger.ts';

const log = createModuleLogger('db-error');

export interface PgError {
  code: string;
  constraint?: string;
  detail?: string;
  message: string;
}

export function isPgError(err: unknown): err is PgError {
  return typeof (err as { code?: unknown })?.code === 'string' && typeof (err as { detail?: unknown })?.detail === 'string';
}

export function resolvePgError(err: unknown): PgError | undefined {
  let current: unknown = err;
  while (current && typeof current === 'object') {
    if (isPgError(current)) return current;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

const ERROR_CLASSES = {
  conflict: ConflictError,
  badRequest: BadRequestError,
  notFound: NotFoundError,
  unauthorized: UnauthorizedError,
  forbidden: ForbiddenError,
} as const;

export type ConstraintErrorStatus = keyof typeof ERROR_CLASSES;

export interface ConstraintMapping {
  status: ConstraintErrorStatus;
  message: string;
}

export function translateConstraintError(err: unknown, constraints: Record<string, ConstraintMapping>): never {
  const pgError = resolvePgError(err);
  if (!pgError) throw err;

  const { code, constraint, detail } = pgError;

  if (constraint && constraints[constraint]) {
    const { status, message } = constraints[constraint];
    log.debug({ code, constraint, detail }, 'db constraint violation');
    throw new ERROR_CLASSES[status](message);
  }

  if (constraint) {
    log.warn({ err, code, constraint, detail }, 'unmapped db constraint violation');
  }

  throw err;
}
