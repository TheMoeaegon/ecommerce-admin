import { z } from 'zod';

import { ErrorCode } from '../errors.ts';

export const validationErrorSchema = z.object({
  field: z.string().describe('Dot-notation path of the invalid field'),
  message: z.string().describe('Reason the field failed validation'),
});

export const errorDetailsSchema = z
  .union([z.array(validationErrorSchema), z.null()])
  .describe('Field-level validation issues, or null when not applicable');

export const badRequestErrorSchema = z.object({
  error: z.object({
    code: z.enum(Object.values(ErrorCode) as [string, ...string[]]).describe('Machine-readable error code'),
    message: z.string().describe('Human-readable error message'),
    details: errorDetailsSchema,
  }),
});

const createErrorSchema = (codes: [string, ...string[]], details: z.ZodType<unknown> = z.null()) =>
  z.object({
    error: z.object({
      code: z.enum(codes).describe('Machine-readable error code'),
      message: z.string().describe('Human-readable error message'),
      details: details.describe('Field-level validation issues, or null when not applicable'),
    }),
  });

export const unauthorizedErrorSchema = createErrorSchema([ErrorCode.UNAUTHORIZED]);
export const forbiddenErrorSchema = createErrorSchema([ErrorCode.FORBIDDEN]);
export const notFoundErrorSchema = createErrorSchema([ErrorCode.RESOURCE_NOT_FOUND]);
export const conflictErrorSchema = createErrorSchema([ErrorCode.CONFLICT]);
export const internalServerErrorSchema = createErrorSchema([ErrorCode.INTERNAL_SERVER_ERROR]);
