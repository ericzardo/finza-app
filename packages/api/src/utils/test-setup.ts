import env from '@env';
import cookie from '@fastify/cookie';
import { authRoutes } from '@features/auth/routes';
import { bucketsRoutes } from '@features/buckets/routes';
import { healthRoutes } from '@features/health/routes';
import { usersRoutes } from '@features/users/routes';
import { workspacesRoutes } from '@features/workspaces/routes';
import authGuardPlugin from '@hooks/auth-guard';
import workspaceGuardPlugin from '@hooks/workspace-guard';
import errorHandlerPlugin from '@plugins/error-handler.plugin';
import prismaPlugin from '@plugins/prisma.plugin';
import rateLimitPlugin from '@plugins/rate-limit.plugin';
import swaggerPlugin from '@plugins/swagger.plugin';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

export async function setupTestServer() {
  const fastify = Fastify({ logger: false });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

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
  await fastify.register(prismaPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(authGuardPlugin);
  await fastify.register(workspaceGuardPlugin);

  await fastify.register(authRoutes);
  await fastify.register(healthRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(workspacesRoutes);
  await fastify.register(bucketsRoutes);

  await fastify.ready();
  return fastify;
}
