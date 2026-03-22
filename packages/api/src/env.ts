import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),
  PORT: z.coerce.number().int().positive().default(9999),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  APP_URL: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(8),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env as Record<string, unknown>);

export default env;
