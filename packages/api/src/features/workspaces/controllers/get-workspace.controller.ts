import { AppError, ErrorCode } from '@errors/app-error';
import { getWorkspace } from '@features/workspaces/usecases/get-workspace';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function getWorkspaceController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const { workspaceId } = request.params as { workspaceId: string };

  if (!request.user?.sub) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      401,
      'Token de autenticação não encontrado',
    );
  }

  const workspace = await getWorkspace(
    fastify.prisma,
    workspaceId,
    request.user.sub,
  );

  if (!workspace) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Workspace não encontrado');
  }

  return reply.code(200).send(workspace);
}
