import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import env from '@env';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const adapter = new PrismaPg({
  connectionString: env.DIRECT_URL,
});

const prismaPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'dev' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, { name: 'prisma' });
