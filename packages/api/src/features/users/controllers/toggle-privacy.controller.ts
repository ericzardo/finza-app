import { AppError, ErrorCode } from '@errors/app-error';
import { togglePrivacy } from '@features/users/usecases/toggle-privacy';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function togglePrivacyController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  if (!request.user?.sub) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      401,
      'Token de autenticação não encontrado',
    );
  }

  const result = await togglePrivacy(fastify.prisma, request.user.sub);

  return reply.code(200).send(result);
}
