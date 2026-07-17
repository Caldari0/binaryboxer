// ============================================================
// Binary Boxer — Contract Foundation
// Runtime-validated (zod) shared contracts. This module tree is
// the ONLY contract source for rebuild code; never import the
// legacy shared/api.ts or shared/types.ts from rebuild modules.
// ============================================================

import { z } from 'zod';

/**
 * Protocol version carried on every response envelope. Bump when a
 * request/response shape changes incompatibly; durable RECORD versions
 * are tracked separately by the persistence envelope ({ v, data }).
 */
export const CONTRACT_VERSION = 1 as const;

export const ErrorCodeSchema = z.enum([
  'VALIDATION',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'CONFLICT',
  'REVISION_CONFLICT',
  'PHASE_INVALID',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  code: ErrorCodeSchema,
  message: z.string().min(1),
  contractVersion: z.literal(CONTRACT_VERSION),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const errorResponse = (code: ErrorCode, message: string): ErrorResponse => ({
  status: 'error',
  code,
  message,
  contractVersion: CONTRACT_VERSION,
});
