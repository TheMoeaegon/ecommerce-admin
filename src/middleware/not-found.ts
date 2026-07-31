import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/errors.ts';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
