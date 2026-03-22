import { checkHealthUseCase } from '@features/health/usecases/check-health';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function checkHealthController(
  _request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const result = await checkHealthUseCase(fastify.prisma);

  return reply.send(result);
}
