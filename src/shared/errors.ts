export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_MULTIPART_REQUEST: 'INVALID_MULTIPART_REQUEST',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string = 'An unexpected error occurred.', code: string = ErrorCode.INTERNAL_SERVER_ERROR, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource does not exist.', code = ErrorCode.RESOURCE_NOT_FOUND) {
    super(message, code, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code: string = ErrorCode.BAD_REQUEST) {
    super(message, code, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = ErrorCode.UNAUTHORIZED) {
    super(message, code, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.', code = ErrorCode.FORBIDDEN) {
    super(message, code, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = ErrorCode.CONFLICT) {
    super(message, code, 409);
  }
}
