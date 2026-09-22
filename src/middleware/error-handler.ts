import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError, ErrorCode } from '../shared/errors.ts';
import multer from 'multer';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    req.log.warn({ err }, 'Multipart upload error');
    return res.status(400).json({
      error: {
        code: ErrorCode.INVALID_MULTIPART_REQUEST,
        message: err.message,
        details: null,
      },
    });
  }

  if ((err as any).type === 'entity.parse.failed') {
    req.log.warn({ err }, 'Invalid json');
    return res.status(400).json({
      error: {
        code: ErrorCode.INVALID_JSON,
        message: 'The request body contains malformed JSON.',
        details: null,
      },
    });
  }

  if (err instanceof Error && err.message === 'Unexpected end of form') {
    req.log.warn({ err }, 'Invalid multipart request');
    return res.status(400).json({
      error: {
        code: ErrorCode.INVALID_MULTIPART_REQUEST,
        message: 'The multipart request body is incomplete or malformed.',
        details: null,
      },
    });
  }

  if (err instanceof ZodError) {
    req.log.warn({ err }, 'validation failed');
    return res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'One or more validation errors occurred.',
        details: err.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
  }

  if (err instanceof AppError) {
    req.log.warn(err.message);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: null,
      },
    });
  }

  req.log.error({ err }, 'unhandled error');
  return res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      details: null,
    },
  });
}
