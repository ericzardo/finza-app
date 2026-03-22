import { AppError, ErrorCode } from '@errors/app-error';
import { listWorkspaces } from '@features/workspaces/usecases/list-workspaces';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function listWorkspacesController(
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

  const workspaces = await listWorkspaces(fastify.prisma, request.user.sub);

  return reply.code(200).send(workspaces);
}
