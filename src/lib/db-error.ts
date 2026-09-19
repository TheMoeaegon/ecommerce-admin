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
  if (!isPgError(err)) throw err;

  const { code, constraint, detail } = err;

  if (constraint && constraints[constraint]) {
    const { status, message } = constraints[constraint];
    log.warn({ err, code, constraint, detail }, 'db constraint violation');
    throw new ERROR_CLASSES[status](message);
  }

  if (constraint) {
    log.warn({ err, code, constraint, detail }, 'unmapped db constraint violation');
  }

  throw err;
}