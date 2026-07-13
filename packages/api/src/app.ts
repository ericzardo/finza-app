import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import authGuardPlugin from '@hooks/auth-guard';
import workspaceGuardPlugin from '@hooks/workspace-guard';
import errorHandlerPlugin from '@plugins/error-handler.plugin';
import prismaPlugin from '@plugins/prisma.plugin';
import rateLimitPlugin from '@plugins/rate-limit.plugin';
import swaggerPlugin from '@plugins/swagger.plugin';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import env from '@env';
import { authRoutes } from '@features/auth/routes';
import { bucketsRoutes } from '@features/buckets/routes';
import { healthRoutes } from '@features/health/routes';
import { transactionsRoutes } from '@features/transactions/routes';
import { usersRoutes } from '@features/users/routes';
import { workspacesRoutes } from '@features/workspaces/routes';

export async function build(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(cors, {
    origin: [env.APP_URL],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    preflightContinue: false,
  });

  await fastify.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === 'prod',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    },
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1,
    },
  });
  await fastify.register(prismaPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(authGuardPlugin);
  await fastify.register(workspaceGuardPlugin);

  await fastify.register(usersRoutes);
  await fastify.register(authRoutes);
  await fastify.register(workspacesRoutes);
  await fastify.register(bucketsRoutes);
  await fastify.register(transactionsRoutes);
  await fastify.register(healthRoutes);

  return fastify;
}
