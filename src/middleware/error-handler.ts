import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../shared/errors.ts';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    req.log.warn({ err }, 'validation failed');
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    });
  }

  if (err instanceof AppError) {
    req.log.warn(err.message);
    return res.status(err.statusCode).json({ message: err.message });
  }

  req.log.error({ err }, 'unhandled error');
  return res.status(500).json({ message: 'Internal server error' });
}
