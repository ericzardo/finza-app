import { AppError, ErrorCode } from '@errors/app-error';
import { createWorkspace } from '@features/workspaces/usecases/create-workspace';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function createWorkspaceController(
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

  const body = request.body as { name: string; currency: string };

  const workspace = await createWorkspace(fastify.prisma, {
    name: body.name,
    currency: body.currency,
    userId: request.user.sub,
  });

  return reply.code(201).send(workspace);
}
