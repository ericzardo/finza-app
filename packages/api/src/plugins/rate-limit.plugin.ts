import rateLimit from '@fastify/rate-limit';
import { AppError, ErrorCode } from '@errors/app-error';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => {
      throw new AppError(
        ErrorCode.TOO_MANY_REQUESTS,
        429,
        'Muitas requisições. Por favor, aguarde um momento antes de tentar novamente.',
        { retryAfter: context.after },
      );
    },
  });
};

export default fp(rateLimitPlugin, { name: 'rate-limit' });
