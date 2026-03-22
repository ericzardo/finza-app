import { z } from 'zod';

export const healthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.literal('up'),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
