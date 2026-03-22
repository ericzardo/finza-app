import 'dotenv/config';
import { defineConfig, PrismaConfig } from 'prisma/config';
import env from './src/env';

export default defineConfig({
  schema: 'db/prisma/schema.prisma',
  migrations: {
    path: 'db/prisma/migrations',
    seed: 'bunx db/prisma/seed.ts',
  },
  datasource: {
    url: env.DIRECT_URL || env.DATABASE_URL,
  },
} satisfies PrismaConfig);
