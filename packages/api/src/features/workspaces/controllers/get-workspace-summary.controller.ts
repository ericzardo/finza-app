import { AppError, ErrorCode } from '@errors/app-error';
import { getWorkspaceSummary } from '@features/workspaces/usecases/get-workspace-summary';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function getWorkspaceSummaryController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  if (!request.workspaceId) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'Workspace ID não encontrado no contexto da requisição',
    );
  }

  const query = request.query as {
    startDate?: string;
    endDate?: string;
  };

  const summary = await getWorkspaceSummary(
    fastify.prisma,
    request.workspaceId,
    {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    },
  );

  return reply.code(200).send(summary);
}
