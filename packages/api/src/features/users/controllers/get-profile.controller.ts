import { AppError, ErrorCode } from '@errors/app-error';
import { getProfile } from '@features/users/usecases/get-profile';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function getProfileController(
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

  const profile = await getProfile(fastify.prisma, request.user.sub);

  return reply.code(200).send(profile);
}
