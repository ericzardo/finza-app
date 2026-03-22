import { z } from 'zod';
import { ErrorCode } from '@errors/app-error';

export const appErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
